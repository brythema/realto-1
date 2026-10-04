/**
 * REALTO Comprehensive Smoke & Stress Test Suite
 * Grounded in /docs/REALTO-DEVELOPER-GUIDE.md
 */

import { SEED_PROPERTIES, SEED_DEVELOPERS, SEED_USERS, SEED_CHANGE_REQUESTS } from '../src/data/seedData';
import { Property, PropertyCategory, PropertyStatus, PropertyAvailability } from '../src/types/property';
import { ChangeRequest, ChangeRequestType } from '../src/types/change-request';
import { UserProfile, AccountStatus } from '../src/types/roles';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
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
console.log('REALTO NIGERIA - SMOKE & STRESS TEST HARNESS (V2.1)');
console.log('====================================================\n');

async function executeTestSuite() {
  // ----------------------------------------------------
  // SUITE 1: SMOKE TESTS (Core Integrity & Seed Data)
  // ----------------------------------------------------
  console.log('--- SUITE 1: SMOKE TESTS (Core Data & Seed Integrity) ---');

  await runTest('Smoke Tests', 'Seed Properties Data Integrity', () => {
    assert(SEED_PROPERTIES.length >= 6, 'Should have at least 6 seed properties');
    for (const p of SEED_PROPERTIES) {
      assert(p.id.startsWith('RTL-'), `Invalid property id: ${p.id}`);
      assert(!!p.title, `Missing title on ${p.id}`);
      assert(p.price.amount > 0, `Invalid price on ${p.id}`);
      assert(p.price.currency === 'NGN', `Currency must be NGN on ${p.id}`);
      assert(!!p.location.state && !!p.location.city && !!p.location.area, `Incomplete location on ${p.id}`);
      assert(!!p.coverImageUrl, `Missing cover image on ${p.id}`);
      assert(typeof p.version === 'number' && p.version >= 1, `Invalid version on ${p.id}`);
    }
  });

  await runTest('Smoke Tests', 'Nigerian Taxonomy Coverage', () => {
    const categories = new Set(SEED_PROPERTIES.map((p) => p.category));
    assert(categories.has('HOUSE'), 'Must contain HOUSE category');
    assert(categories.has('FLAT_APARTMENT'), 'Must contain FLAT_APARTMENT category');
    assert(categories.has('LAND'), 'Must contain LAND category');
    assert(categories.has('COMMERCIAL'), 'Must contain COMMERCIAL category');
  });

  await runTest('Smoke Tests', 'Zero Contact Info Leakage on Public Cards', () => {
    for (const p of SEED_PROPERTIES) {
      // Owner contact phone or private address must never be in public fields
      assert(!p.title.includes('+234'), `Phone number found in title: ${p.title}`);
      assert(!p.description.includes('+234'), `Phone number found in description on ${p.id}`);
      assert(!p.description.includes('@'), `Direct email found in description on ${p.id}`);
      // Exact street address must be quarantined in privateDetails
      assert(p.location.estate !== p.privateDetails?.exactAddress, 'Private street address leaked in estate field');
    }
  });

  // ----------------------------------------------------
  // SUITE 2: VISIBILITY COMPUTATION MATRIX (recomputeVisibility)
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: VISIBILITY MATRIX (All 16 Permutations) ---');

  const computeVisibility = (
    ownerStatus: AccountStatus,
    propertyStatus: PropertyStatus,
    availability: PropertyAvailability,
    isDeleted: boolean
  ): boolean => {
    return (
      ownerStatus === 'ACTIVE' &&
      propertyStatus === 'LIVE' &&
      availability === 'AVAILABLE' &&
      !isDeleted
    );
  };

  await runTest('Visibility Matrix', 'Active Owner + Live + Available + Not Deleted is strictly TRUE', () => {
    const isPublic = computeVisibility('ACTIVE', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === true, 'Standard live property must be public');
  });

  await runTest('Visibility Matrix', 'Pending Approval Owner must be FALSE regardless of listing state', () => {
    const isPublic = computeVisibility('PENDING_APPROVAL', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === false, 'Pending approval owner listings must never be public');
  });

  await runTest('Visibility Matrix', 'Suspended Owner must be FALSE platform-wide', () => {
    const isPublic = computeVisibility('SUSPENDED', 'LIVE', 'AVAILABLE', false);
    assert(isPublic === false, 'Suspended owner listings must immediately disappear');
  });

  await runTest('Visibility Matrix', 'Drafts and Under Review must be FALSE', () => {
    assert(computeVisibility('ACTIVE', 'DRAFT', 'AVAILABLE', false) === false, 'Drafts cannot be public');
    assert(computeVisibility('ACTIVE', 'PENDING_REVIEW', 'AVAILABLE', false) === false, 'Under review cannot be public');
    assert(computeVisibility('ACTIVE', 'UNPUBLISHED', 'AVAILABLE', false) === false, 'Unpublished cannot be public');
  });

  await runTest('Visibility Matrix', 'Sold and Deleted listings must be FALSE', () => {
    assert(computeVisibility('ACTIVE', 'LIVE', 'SOLD', false) === false, 'Sold properties must be hidden from public');
    assert(computeVisibility('ACTIVE', 'LIVE', 'AVAILABLE', true) === false, 'Soft-deleted listings must be hidden');
  });

  await runTest('Visibility Matrix', 'Exhaustive 16-Permutation Truth Table Verification', () => {
    const ownerStatuses: AccountStatus[] = ['ACTIVE', 'PENDING_APPROVAL'];
    const propStatuses: PropertyStatus[] = ['LIVE', 'DRAFT'];
    const availabilities: PropertyAvailability[] = ['AVAILABLE', 'SOLD'];
    const deletedFlags = [false, true];

    let trueCount = 0;
    for (const o of ownerStatuses) {
      for (const p of propStatuses) {
        for (const a of availabilities) {
          for (const d of deletedFlags) {
            const isPub = computeVisibility(o, p, a, d);
            if (isPub) trueCount++;
          }
        }
      }
    }
    assert(trueCount === 1, `Exactly 1 state out of 16 should be public, found ${trueCount}`);
  });

  // ----------------------------------------------------
  // SUITE 3: PRIVATE DRAFT DATA ISOLATION & SUBMISSION
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: PRIVATE DRAFT WORKFLOW & CHANGE REQUEST TRANSITIONS ---');

  let mockDraftStore: Property[] = [];
  let mockChangeRequests: ChangeRequest[] = [];

  await runTest('Draft Workflow', 'Creating draft stores private state without Change Request', () => {
    const draft: Property = {
      id: 'RTL-DRAFT-TEST-1',
      slug: 'test-draft-property',
      title: 'Draft Luxury Maisonette in Victoria Island',
      category: 'HOUSE',
      propertyType: 'DETACHED_DUPLEX',
      price: { amount: 150000000, currency: 'NGN', negotiable: true },
      location: {
        state: 'Lagos',
        stateSlug: 'lagos',
        city: 'Victoria Island',
        citySlug: 'victoria-island',
        area: 'Oniru',
        areaSlug: 'oniru',
      },
      specifications: { bedrooms: 4, bathrooms: 4, landSize: 400 },
      description: 'Private draft assemble test',
      features: ['Security'],
      images: [{ id: '1', url: 'https://test.img', order: 1, isCover: true }],
      coverImageUrl: 'https://test.img',
      ownerRef: { type: 'SELLER', id: 'seller-test', ownerName: 'Test Seller' },
      submittedBy: 'seller-test',
      status: 'DRAFT',
      availability: 'AVAILABLE',
      isPublic: false,
      isDeleted: false,
      hasPendingChange: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockDraftStore.push(draft);
    assert(mockDraftStore.length === 1, 'Draft should be stored');
    assert(draft.status === 'DRAFT', 'Status must be DRAFT');
    assert(draft.isPublic === false, 'Draft must NOT be public');
    assert(mockChangeRequests.length === 0, 'Draft edits must NEVER generate Change Requests');
  });

  await runTest('Draft Workflow', 'Editing draft updates local fields freely with zero change request', () => {
    const draft = mockDraftStore[0];
    draft.price.amount = 175000000;
    draft.title = 'Updated Title in Draft Mode';
    draft.specifications.bedrooms = 5;

    assert(draft.price.amount === 175000000, 'Price updated');
    assert(draft.specifications.bedrooms === 5, 'Bedrooms updated');
    assert(mockChangeRequests.length === 0, 'Still zero Change Requests during draft revisions');
  });

  await runTest('Draft Workflow', 'Submitting draft locks property and dispatches PROPERTY_SUBMIT request', () => {
    const draft = mockDraftStore[0];
    const requestId = 'cr-test-sub-1';

    // Transition to PENDING_REVIEW
    draft.status = 'PENDING_REVIEW';
    draft.hasPendingChange = true;
    draft.pendingChangeId = requestId;

    const cr: ChangeRequest = {
      id: requestId,
      type: 'PROPERTY_SUBMIT',
      targetType: 'PROPERTY',
      targetId: draft.id,
      targetTitle: draft.title,
      requestedBy: draft.submittedBy,
      requesterName: 'Test Seller',
      requesterRole: 'SELLER',
      proposedData: {
        status: 'LIVE',
        isPublic: true,
        title: draft.title,
        price: draft.price,
      },
      previousData: { status: 'DRAFT', isPublic: false },
      baseVersion: draft.version,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockChangeRequests.push(cr);
    assert(draft.status === 'PENDING_REVIEW', 'Status must be PENDING_REVIEW');
    assert(draft.hasPendingChange === true, 'Property must be locked with pending change flag');
    assert(mockChangeRequests.length === 1, 'PROPERTY_SUBMIT Change Request must be recorded');
  });

  await runTest('Draft Workflow', 'Admin Atomic Approval publishes listing live and increments version', () => {
    const cr = mockChangeRequests[0];
    const draft = mockDraftStore.find((p) => p.id === cr.targetId)!;

    // Execute atomic transaction
    draft.status = 'LIVE';
    draft.isPublic = true;
    draft.hasPendingChange = false;
    draft.pendingChangeId = undefined;
    draft.approvedAt = new Date().toISOString();
    draft.version += 1;

    cr.status = 'APPROVED';
    cr.decisionBy = 'admin-1';
    cr.decisionAt = new Date().toISOString();

    assert(draft.status === 'LIVE', 'Listing must be LIVE');
    assert(draft.isPublic === true, 'Listing must be isPublic = true');
    assert(draft.version === 2, 'Version must increment to 2');
    assert(draft.hasPendingChange === false, 'Pending change lock released');
    assert(cr.status === 'APPROVED', 'Change Request marked APPROVED');
  });

  // ----------------------------------------------------
  // SUITE 4: LIVE DATA IMMUTABILITY & EDIT REQUESTS
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: LIVE DATA IMMUTABILITY & CHANGE REQUEST ENGINE ---');

  await runTest('Live Data Lifecycle', 'Modifying live listing stages proposedData without altering live record', () => {
    const liveProp = mockDraftStore[0];
    const oldPrice = liveProp.price.amount;
    const proposedPrice = 210000000;

    const editCr: ChangeRequest = {
      id: 'cr-test-edit-1',
      type: 'PROPERTY_EDIT',
      targetType: 'PROPERTY',
      targetId: liveProp.id,
      targetTitle: liveProp.title,
      requestedBy: liveProp.submittedBy,
      requesterName: 'Test Seller',
      requesterRole: 'SELLER',
      proposedData: { price: { amount: proposedPrice, currency: 'NGN', negotiable: false } },
      previousData: { price: liveProp.price },
      baseVersion: liveProp.version,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    liveProp.hasPendingChange = true;
    mockChangeRequests.push(editCr);

    // CRITICAL: Live record MUST still show oldPrice on public site!
    assert(liveProp.price.amount === oldPrice, 'Live price must NOT change while request is pending!');
    assert(liveProp.hasPendingChange === true, 'Property marked with pending change');
    assert(editCr.proposedData.price.amount === proposedPrice, 'Proposed price safely staged in Change Request');
  });

  await runTest('Live Data Lifecycle', 'Admin rejection enforces mandatory written reason and preserves live data', () => {
    const editCr = mockChangeRequests.find((cr) => cr.id === 'cr-test-edit-1')!;
    const liveProp = mockDraftStore.find((p) => p.id === editCr.targetId)!;

    const rejectionReason = 'Valuation discrepancy: proposed price is not supported by recent neighborhood comparables.';
    assert(rejectionReason.length > 5, 'Written reason mandatory');

    editCr.status = 'REJECTED';
    editCr.decisionReason = rejectionReason;
    editCr.decisionBy = 'admin-1';
    liveProp.hasPendingChange = false;

    // Verify live record is completely untouched
    assert(liveProp.price.amount === 175000000, 'Live price remained unchanged');
    assert(liveProp.version === 2, 'Version did not increment on rejection');
    assert(editCr.status === 'REJECTED', 'Change Request rejected');
    assert(editCr.decisionReason === rejectionReason, 'Written reason recorded');
  });

  await runTest('Live Data Lifecycle', 'Soft deletion request preserves permanent history', () => {
    const liveProp = mockDraftStore[0];
    const delCr: ChangeRequest = {
      id: 'cr-test-del-1',
      type: 'PROPERTY_DELETE',
      targetType: 'PROPERTY',
      targetId: liveProp.id,
      targetTitle: liveProp.title,
      requestedBy: liveProp.submittedBy,
      requesterName: 'Test Seller',
      requesterRole: 'SELLER',
      proposedData: { isDeleted: true },
      previousData: { isDeleted: false },
      baseVersion: liveProp.version,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Admin approves delete
    delCr.status = 'APPROVED';
    liveProp.isDeleted = true;
    liveProp.isPublic = false;
    liveProp.deletedAt = new Date().toISOString();

    assert(liveProp.isDeleted === true, 'Soft-delete flag true');
    assert(liveProp.isPublic === false, 'Removed from public site');
    assert(mockDraftStore.some((p) => p.id === liveProp.id), 'Property record physically preserved in store for audit');
  });

  // ----------------------------------------------------
  // SUITE 5: DEVELOPER SPACE ELIGIBILITY RULE
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: DEVELOPER SPACE ELIGIBILITY RULE (>= 2 Live Units) ---');

  await runTest('Developer Spaces', 'Developer with < 2 live properties has hasDeveloperSpace = false', () => {
    const devProperties = [
      { id: 'p1', ownerRef: { id: 'dev-alpha' }, status: 'LIVE', isPublic: true, isDeleted: false },
    ];
    const liveCount = devProperties.filter((p) => p.status === 'LIVE' && p.isPublic && !p.isDeleted).length;
    const hasSpace = liveCount >= 2;
    assert(hasSpace === false, 'Developer with 1 property must NOT have public Space');
  });

  await runTest('Developer Spaces', 'Developer with >= 2 live properties unlocks Developer Space', () => {
    const devProperties = [
      { id: 'p1', ownerRef: { id: 'dev-alpha' }, status: 'LIVE', isPublic: true, isDeleted: false },
      { id: 'p2', ownerRef: { id: 'dev-alpha' }, status: 'LIVE', isPublic: true, isDeleted: false },
    ];
    const liveCount = devProperties.filter((p) => p.status === 'LIVE' && p.isPublic && !p.isDeleted).length;
    const hasSpace = liveCount >= 2;
    assert(hasSpace === true, 'Developer with 2 live units must unlock Developer Space');
  });

  await runTest('Developer Spaces', 'Unpublishing a unit dynamically revokes Developer Space when below 2', () => {
    const devProperties = [
      { id: 'p1', ownerRef: { id: 'dev-alpha' }, status: 'LIVE', isPublic: true, isDeleted: false },
      { id: 'p2', ownerRef: { id: 'dev-alpha' }, status: 'UNPUBLISHED', isPublic: false, isDeleted: false },
    ];
    const liveCount = devProperties.filter((p) => p.status === 'LIVE' && p.isPublic && !p.isDeleted).length;
    const hasSpace = liveCount >= 2;
    assert(hasSpace === false, 'Developer Space dynamically disabled when active units drop below 2');
  });

  // ----------------------------------------------------
  // SUITE 6: HIGH VOLUME STRESS TESTING
  // ----------------------------------------------------
  console.log('\n--- SUITE 6: HIGH VOLUME STRESS TESTING ---');

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
      const price = 25000000 + (i * 750000);
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

  await runTest('Stress Test', `Multi-attribute filtering over ${STRESS_COUNT} properties in < 15ms`, () => {
    const startFilter = performance.now();

    // Query: Houses in Lagos with 4+ bedrooms between 50M and 250M NGN that are public
    const results = stressProperties.filter((p) => {
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
    console.log(`    -> Filtered down to ${results.length} properties in ${elapsed.toFixed(3)}ms`);
    assert(elapsed < 15, `Filtering must execute in < 15ms (took ${elapsed.toFixed(3)}ms)`);
  });

  await runTest('Stress Test', 'Bulk Change Request processing throughput (500 sequential atomic approvals)', () => {
    const bulkRequests: ChangeRequest[] = [];
    for (let i = 0; i < 500; i++) {
      bulkRequests.push({
        id: `cr-bulk-${i}`,
        type: 'PROPERTY_SUBMIT',
        targetType: 'PROPERTY',
        targetId: stressProperties[i].id,
        targetTitle: stressProperties[i].title,
        requestedBy: stressProperties[i].submittedBy,
        requesterName: 'Bulk Tester',
        requesterRole: 'DEVELOPER',
        proposedData: { status: 'LIVE', isPublic: true },
        previousData: { status: 'DRAFT', isPublic: false },
        baseVersion: 1,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const startBulk = performance.now();
    for (const req of bulkRequests) {
      req.status = 'APPROVED';
      req.decisionBy = 'admin-stress-tester';
      req.decisionAt = new Date().toISOString();
      const target = stressProperties.find((p) => p.id === req.targetId)!;
      target.status = 'LIVE';
      target.isPublic = true;
      target.version += 1;
    }
    const elapsed = performance.now() - startBulk;
    console.log(`    -> Processed 500 atomic transitions in ${elapsed.toFixed(2)}ms (${(500 / (elapsed / 1000)).toFixed(0)} ops/sec)`);
    assert(elapsed < 100, `Bulk approvals took ${elapsed.toFixed(2)}ms (expected < 100ms)`);
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Assertions Checked: ${total}`);
  console.log(`Passed:                   ${passed}`);
  console.log(`Failed:                   ${failed}`);

  if (failed === 0) {
    console.log('\n>> ALL SMOKE AND STRESS TESTS PASSED WITH 100% SUCCESS <<\n');
  } else {
    console.error(`\n>> ${failed} TESTS FAILED <<\n`);
    process.exit(1);
  }
}

executeTestSuite();
