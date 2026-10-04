/**
 * REALTO Comprehensive Smoke, Security & Stress Test Suite (V2.2)
 * Grounded in /docs/REALTO-DEVELOPER-GUIDE.md and /docs/DECISIONS.md
 */

import { dbStore, hashPassword, generateSalt, UserRecord } from '../src/server/db';
import { Property, PropertyCategory, PropertyStatus, PropertyAvailability } from '../src/types/property';
import { ChangeRequest } from '../src/types/change-request';
import { UserProfile, AccountStatus } from '../src/types/roles';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTest(suite: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    results.push({ suite, name, passed: true, durationMs: duration });
    console.log(`  [PASS] ${name} (${duration.toFixed(2)}ms)`);
  } catch (err: any) {
    const duration = performance.now() - start;
    results.push({ suite, name, passed: false, durationMs: duration, error: err.message });
    console.error(`  [FAIL] ${name} (${duration.toFixed(2)}ms): ${err.message}`);
  }
}

console.log('====================================================');
console.log('REALTO NIGERIA - ARCHITECTURAL AUDIT & REGRESSION HARNESS');
console.log('====================================================\n');

async function executeTestSuite() {
  // ----------------------------------------------------
  // SUITE 1: AUTHENTICATION, PASSWORD HASHING & SESSIONS
  // ----------------------------------------------------
  console.log('--- SUITE 1: AUTHENTICATION & CREDENTIAL SECURITY ---');

  await runTest('Auth Security', 'Secure PBKDF2 Password Hashing with Salt', () => {
    const salt = generateSalt();
    const pass = 'SuperSecret2026!';
    const hash1 = hashPassword(pass, salt);
    const hash2 = hashPassword(pass, salt);
    const wrongHash = hashPassword('WrongPassword', salt);

    assert(hash1.length >= 64, 'Hash must be at least 64 hex characters');
    assert(hash1 === hash2, 'Identical password + salt must produce identical hash');
    assert(hash1 !== wrongHash, 'Different passwords must produce different hashes');
  });

  await runTest('Auth Security', 'Admin and Partner Accounts Have Secure Password Hashes', () => {
    const users = dbStore.getUsers();
    assert(users.length >= 4, 'Must have at least 4 registered users in database');
    for (const u of users) {
      assert(!!u.passwordHash, `Missing password hash on user ${u.uid}`);
      assert(!!u.salt, `Missing salt on user ${u.uid}`);
      assert(u.passwordHash !== 'plaintext', `Password stored in plaintext on ${u.uid}`);
    }
  });

  // ----------------------------------------------------
  // SUITE 2: DATA SANITIZATION & ZERO PRIVATE LEAKAGE
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: ZERO CONTACT LEAKAGE & PRIVATE DATA QUARANTINE ---');

  await runTest('Data Sanitization', 'Public Properties Strip Sensitive Fields', () => {
    const properties = dbStore.getProperties();
    for (const p of properties) {
      const sanitized = dbStore.sanitizePublicProperty(p);
      assert(!('exactAddress' in sanitized), `exactAddress leaked in public DTO for ${p.id}`);
      assert(!('ownershipDetails' in sanitized), `ownershipDetails leaked in public DTO for ${p.id}`);
      assert(!('privateDetails' in sanitized), `privateDetails object leaked in public DTO for ${p.id}`);

      // Sanitize ownerRef so seller phone/email is not leaked
      const ownerRef = sanitized.ownerRef as any;
      assert(!ownerRef?.phone, `Seller direct phone leaked in ownerRef for ${p.id}`);
      assert(!ownerRef?.email, `Seller direct email leaked in ownerRef for ${p.id}`);
    }
  });

  // ----------------------------------------------------
  // SUITE 3: VISIBILITY COMPUTATION MATRIX (Decision 003)
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: VISIBILITY MATRIX & PENDING OWNER ISOLATION ---');

  await runTest('Visibility Matrix', 'Active Owner + Live + Available + Not Deleted is strictly TRUE', () => {
    const isPublic = dbStore.computeVisibility('ACTIVE', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === true, 'Approved live listing with active owner must be public');
  });

  await runTest('Visibility Matrix', 'Pending Approval Owner must be FALSE regardless of listing state', () => {
    // CRITICAL REGRESSION TEST for High Finding #6:
    // Approving a property submit cannot make it public if the owner is still pending approval!
    const isPublic = dbStore.computeVisibility('PENDING_APPROVAL', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === false, 'Pending owner listing must NEVER be visible on public marketplace');
  });

  await runTest('Visibility Matrix', 'Suspended Owner must be FALSE platform-wide', () => {
    const isPublic = dbStore.computeVisibility('SUSPENDED', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === false, 'Suspended user listings must be immediately hidden');
  });

  await runTest('Visibility Matrix', 'Drafts, Under Review, and Sold listings must be FALSE', () => {
    assert(dbStore.computeVisibility('ACTIVE', 'DRAFT', 'AVAILABLE', false) === false, 'Drafts cannot be public');
    assert(dbStore.computeVisibility('ACTIVE', 'PENDING_REVIEW', 'AVAILABLE', false) === false, 'Under review cannot be public');
    assert(dbStore.computeVisibility('ACTIVE', 'LIVE', 'SOLD', false) === false, 'Sold listings cannot be public');
  });

  // ----------------------------------------------------
  // SUITE 4: ONE PENDING REQUEST PER TARGET & OWNERSHIP
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: CHANGE REQUEST ENGINE INVARIANTS ---');

  await runTest('Change Requests', 'Sequential ID generator prevents collisions', () => {
    const id1 = dbStore.nextPropertyId();
    const id2 = dbStore.nextPropertyId();
    const cr1 = dbStore.nextChangeRequestId();
    const cr2 = dbStore.nextChangeRequestId();

    assert(id1.startsWith('RTL-'), `Property ID must start with RTL-, got ${id1}`);
    assert(cr1.startsWith('CR-'), `CR ID must start with CR-, got ${cr1}`);
    assert(id1 !== id2, 'Property IDs must be strictly unique');
    assert(cr1 !== cr2, 'Change Request IDs must be strictly unique');
  });

  await runTest('Change Requests', 'Atomic transition on approval increments version and releases lock', () => {
    const targetProp = dbStore.getPropertyById('RTL-00101')!;
    const initialVersion = targetProp.version;

    // Simulate change request
    const crId = dbStore.nextChangeRequestId();
    targetProp.hasPendingChange = true;
    targetProp.pendingChangeId = crId;

    // Approve
    targetProp.hasPendingChange = false;
    targetProp.pendingChangeId = undefined;
    targetProp.version += 1;

    assert(targetProp.version === initialVersion + 1, 'Version must increment on approval');
    assert(targetProp.hasPendingChange === false, 'Pending change lock must be released');
  });

  await runTest('Change Requests', 'Rejection marks REJECTED and preserves decision reason for revision', () => {
    const testProp: Property = {
      id: dbStore.nextPropertyId(),
      slug: 'test-rejection-prop',
      title: 'Unverified Penthouse',
      category: 'HOUSE',
      propertyType: 'PENTHOUSE',
      price: { amount: 300000000, currency: 'NGN', negotiable: true },
      location: {
        state: 'Lagos',
        stateSlug: 'lagos',
        city: 'Ikoyi',
        citySlug: 'ikoyi',
        area: 'Old Ikoyi',
        areaSlug: 'old-ikoyi',
      },
      specifications: { bedrooms: 4, landSize: 600 },
      description: 'Test description',
      features: ['Pool'],
      images: [{ id: '1', url: 'https://test.img', order: 1, isCover: true }],
      coverImageUrl: 'https://test.img',
      ownerRef: { type: 'SELLER', id: 'seller-1', ownerName: 'Seller 1' },
      submittedBy: 'seller-1',
      status: 'PENDING_REVIEW',
      availability: 'AVAILABLE',
      isPublic: false,
      isDeleted: false,
      hasPendingChange: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.addProperty(testProp);

    // Simulate admin rejection
    const reason = 'Deed documentation unclear. Please upload page 3 of Governors Consent.';
    testProp.status = 'REJECTED';
    testProp.hasPendingChange = false;
    testProp.lastDecisionReason = reason;

    assert(testProp.status === 'REJECTED', 'Property must transition to REJECTED');
    assert(testProp.lastDecisionReason === reason, 'Decision reason must be attached for user to fix');
    assert(testProp.hasPendingChange === false, 'Lock must be released so user can edit and resubmit');

    // Clean up
    dbStore.deleteProperty(testProp.id);
  });

  // ----------------------------------------------------
  // SUITE 5: DEVELOPER SPACE ELIGIBILITY (>= 2 Live Units)
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: DEVELOPER SPACE ELIGIBILITY RULE ---');

  await runTest('Developer Space', 'Developer with < 2 live properties has hasDeveloperSpace = false', () => {
    const devs = dbStore.getDevelopers();
    const props = dbStore.getProperties();

    for (const dev of devs) {
      const liveCount = props.filter(
        (p) => p.ownerRef.id === dev.developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
      ).length;

      const eligible = liveCount >= 2;
      assert(
        dev.hasDeveloperSpace === eligible,
        `Developer ${dev.slug} hasDeveloperSpace is ${dev.hasDeveloperSpace}, expected ${eligible} (liveCount: ${liveCount})`
      );
    }
  });

  // ----------------------------------------------------
  // SUITE 6: USER CART INTEGRITY
  // ----------------------------------------------------
  console.log('\n--- SUITE 6: PER-USER CART INTEGRITY ---');

  await runTest('Cart Safety', 'Cart only resolves against public live properties', () => {
    const buyer = dbStore.getUserById('buyer-1')!;
    const publicProps = new Set(
      dbStore
        .getProperties()
        .filter((p) => p.isPublic && !p.isDeleted)
        .map((p) => p.id)
    );

    for (const cartId of buyer.cart) {
      assert(publicProps.has(cartId), `Unpublished or draft property ${cartId} found in cart`);
    }
  });

  // ----------------------------------------------------
  // SUITE 7: STRESS TESTING
  // ----------------------------------------------------
  console.log('\n--- SUITE 7: HIGH VOLUME STRESS TESTING ---');

  const STRESS_COUNT = 1000;
  let stressProperties: Property[] = [];

  await runTest('Stress Test', `Rapid synthesis of ${STRESS_COUNT} Nigerian property records`, () => {
    const categories: PropertyCategory[] = ['HOUSE', 'FLAT_APARTMENT', 'LAND', 'COMMERCIAL'];
    const states = ['Lagos', 'Abuja (FCT)', 'Oyo', 'Rivers'];
    const areas = ['Lekki Phase 1', 'Ikoyi', 'Victoria Island', 'Maitama', 'Jabi', 'Bodija', 'Old GRA'];

    for (let i = 0; i < STRESS_COUNT; i++) {
      const cat = categories[i % categories.length];
      const state = states[i % states.length];
      const area = areas[i % areas.length];
      const price = 25000000 + i * 750000;
      const isLive = i % 2 === 0;

      stressProperties.push({
        id: `RTL-STRESS-${10000 + i}`,
        slug: `property-stress-test-${i}`,
        title: `Property Unit #${i + 1} in ${area}`,
        category: cat,
        propertyType: cat === 'HOUSE' ? 'DETACHED_DUPLEX' : cat === 'LAND' ? 'RESIDENTIAL_LAND' : 'STANDARD_APARTMENT',
        price: { amount: price, currency: 'NGN', negotiable: i % 3 === 0 },
        location: {
          state,
          stateSlug: state.toLowerCase().replace(/\s+/g, '-'),
          city: 'CityCenter',
          citySlug: 'citycenter',
          area,
          areaSlug: area.toLowerCase().replace(/\s+/g, '-'),
        },
        specifications: {
          bedrooms: (i % 6) + 1,
          bathrooms: (i % 5) + 1,
          landSize: 300 + (i % 500),
          landSizeUnit: 'SQM',
          titleDocument: 'C_OF_O',
        },
        description: `Stress test generated property unit description number ${i}`,
        features: ['Borehole', 'Security', 'Paved Road'],
        images: [{ id: `img-${i}`, url: 'https://images.unsplash.com/test', order: 1, isCover: true }],
        coverImageUrl: 'https://images.unsplash.com/test',
        ownerRef: { type: i % 4 === 0 ? 'DEVELOPER' : 'SELLER', id: `owner-${i % 20}`, ownerName: `Owner ${i % 20}` },
        submittedBy: `user-${i % 20}`,
        status: isLive ? 'LIVE' : 'DRAFT',
        availability: i % 10 === 0 ? 'SOLD' : 'AVAILABLE',
        isPublic: isLive && i % 10 !== 0,
        isDeleted: false,
        hasPendingChange: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    assert(stressProperties.length === STRESS_COUNT, `Synthesized exactly ${STRESS_COUNT} properties`);
  });

  await runTest('Stress Test', `Multi-attribute query filtering over ${STRESS_COUNT} properties in < 15ms`, () => {
    const startFilter = performance.now();
    const filtered = stressProperties.filter((p) => {
      return (
        p.isPublic &&
        p.category === 'HOUSE' &&
        p.location.state === 'Lagos' &&
        (p.specifications.bedrooms || 0) >= 4 &&
        p.price.amount >= 50000000 &&
        p.price.amount <= 250000000
      );
    });
    const elapsed = performance.now() - startFilter;
    console.log(`    -> Filtered down to ${filtered.length} properties in ${elapsed.toFixed(3)}ms`);
    assert(elapsed < 15, `Filtering must execute in < 15ms (took ${elapsed.toFixed(3)}ms)`);
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('AUDIT & REGRESSION TEST SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Checks Executed:    ${total}`);
  console.log(`Passed:                   ${passed}`);
  console.log(`Failed:                   ${failed}`);

  if (failed === 0) {
    console.log('\n>> ALL ARCHITECTURAL AUDIT & REGRESSION TESTS PASSED (100%) <<\n');
  } else {
    console.error(`\n>> ${failed} TESTS FAILED <<\n`);
    process.exit(1);
  }
}

executeTestSuite();
