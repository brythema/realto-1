import { Router, Response } from 'express';
import { dbStore, hashPassword, generateSalt, UserRecord } from './db';
import { requireAuth, optionalAuth, requireAdmin, AuthRequest, createSession, revokeSession } from './auth';
import { Property, PropertyCategory } from '../types/property';
import { Developer } from '../types/developer';
import { ChangeRequest } from '../types/change-request';
import { Thread, Message } from '../types/thread';
import { Notification, AuditLog } from '../types/notification';

export const apiRouter = Router();

// Allowed whitelist fields for property edit proposedData
const ALLOWED_PROPERTY_EDIT_FIELDS = [
  'title',
  'description',
  'category',
  'propertyType',
  'price',
  'specifications',
  'features',
  'images',
  'coverImageUrl',
  'location',
];

// Helper to slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

apiRouter.post('/auth/register', (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    state,
    city,
    companyName,
    cacNumber,
    sellerRelationship,
  } = req.body;

  if (!email || !password || !firstName || !lastName || !phone || !role) {
    res.status(400).json({ error: 'Missing required registration fields.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const existing = dbStore.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'An account with this email address already exists.' });
    return;
  }

  if (role === 'DEVELOPER' && (!companyName || !cacNumber)) {
    res.status(400).json({ error: 'Company Name and Corporate Affairs Commission (CAC) number are mandatory for developers.' });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const uid = dbStore.nextUserId(role);
  const now = new Date().toISOString();

  // Rule: Buyers are ACTIVE immediately. Sellers & Developers are PENDING_APPROVAL.
  const accountStatus = role === 'BUYER' ? 'ACTIVE' : 'PENDING_APPROVAL';

  let developerId: string | undefined = undefined;
  let devSlug: string | undefined = undefined;

  if (role === 'DEVELOPER') {
    developerId = `dev-${uid}`;
    devSlug = `${slugify(companyName)}-${uid.slice(-4)}`;

    const newDev: Developer = {
      developerId,
      userId: uid,
      slug: devSlug,
      companyName,
      cacNumber,
      companyAddress: `${city || 'Lagos'}, ${state || 'Lagos State'}, Nigeria`,
      phone,
      email,
      businessOverview: `${companyName} is an active corporate real estate development firm operating in ${state || 'Nigeria'}.`,
      verificationStatus: 'PENDING',
      livePropertiesCount: 0,
      hasDeveloperSpace: false,
      accreditationTier: 'VERIFIED',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    dbStore.addDeveloper(newDev);
  }

  const newUser: UserRecord = {
    uid,
    role,
    email,
    passwordHash,
    salt,
    firstName,
    lastName,
    phone,
    state: state || 'Lagos',
    city: city || 'Lagos',
    accountStatus,
    developerId,
    sellerRelationship: role === 'SELLER' ? (sellerRelationship || 'OWNER') : undefined,
    cart: [],
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addUser(newUser);

  // If SELLER or DEVELOPER, create ACCOUNT_REGISTRATION Change Request!
  if (role === 'SELLER' || role === 'DEVELOPER') {
    const crId = dbStore.nextChangeRequestId();
    const cr: ChangeRequest = {
      id: crId,
      type: 'ACCOUNT_REGISTRATION',
      targetType: 'USER',
      targetId: uid,
      targetTitle: `${role === 'DEVELOPER' ? companyName : `${firstName} ${lastName}`} (${role})`,
      requestedBy: uid,
      requesterName: `${firstName} ${lastName}`.trim(),
      requesterRole: role,
      proposedData: {
        accountStatus: 'ACTIVE',
        role,
        companyName,
        cacNumber,
        state,
        city,
      },
      previousData: { accountStatus: 'PENDING_APPROVAL' },
      baseVersion: 1,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    dbStore.addChangeRequest(cr);

    // Notify Admin of registration queue
    dbStore.addNotification({
      id: dbStore.nextNotificationId(),
      recipientId: 'admin-1',
      title: `New ${role} Account Registration`,
      message: `${cr.requesterName} created an account pending administration approval.`,
      linkTo: '/admin',
      read: false,
      createdAt: now,
    });
  }

  // Welcome notification to user
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: uid,
    title: 'Welcome to Realto Nigeria',
    message:
      role === 'BUYER'
        ? 'Your buyer account is active. Explore verified listings and schedule inspections.'
        : 'Your account has been created and is pending admin approval. You can immediately access your dashboard to create private property drafts.',
    linkTo: '/dashboard',
    read: false,
    createdAt: now,
  });

  // Audit log entry
  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: uid,
    actorName: `${firstName} ${lastName}`.trim(),
    actorRole: role,
    action: 'REGISTER_ACCOUNT',
    entityType: 'USER',
    entityId: uid,
    details: `New account registered as ${role} (status: ${accountStatus}).`,
    timestamp: now,
  });

  const token = createSession(uid);
  const { passwordHash: _, salt: __, ...userProfile } = newUser;

  res.json({
    token,
    user: userProfile,
    message: 'Registration successful',
  });
});

apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const user = dbStore.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.accountStatus === 'SUSPENDED') {
    res.status(403).json({
      error: 'Account Suspended: Your access has been restricted by administration. Contact governance@realto.ng',
    });
    return;
  }

  const token = createSession(user.uid);
  const { passwordHash: _, salt: __, ...userProfile } = user;

  res.json({
    token,
    user: userProfile,
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { passwordHash: _, salt: __, ...userProfile } = req.user;
  res.json({ user: userProfile });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (token) revokeSession(token);
  res.json({ success: true });
});

// Demo accounts endpoint so test runs and reviewers can sign in safely without hardcoding fake shortcuts in UI
apiRouter.get('/auth/demo-accounts', (_req, res) => {
  res.json([
    {
      role: 'ADMIN',
      name: 'Tunde Balogun (Governance Administrator)',
      email: 'admin@realto.ng',
      password: 'AdminPass2026!',
      description: 'Review change requests, inspect KYC, audit logs, toggle listings',
    },
    {
      role: 'DEVELOPER',
      name: 'Eko Prime Developments (Active Developer)',
      email: 'contact@ekoprime.ng',
      password: 'PartnerPass2026!',
      description: 'Dedicated Developer Space, multi-unit catalog, manage drafts',
    },
    {
      role: 'SELLER',
      name: 'Chief Emeka Okonkwo (Pending Seller)',
      email: 'emeka.okonkwo@gmail.com',
      password: 'PartnerPass2026!',
      description: 'Pending approval seller dashboard, create & submit drafts freely',
    },
    {
      role: 'BUYER',
      name: 'Dr. Folake Adeleke (Verified Buyer)',
      email: 'folake.adeleke@unilag.edu.ng',
      password: 'BuyerPass2026!',
      description: 'Saved properties cart, submit inspection inquiries, chat with admin',
    },
  ]);
});

// ----------------------------------------------------
// FILE UPLOAD (Real KYC & Photos with validation)
// ----------------------------------------------------

apiRouter.post('/upload', requireAuth, (req: AuthRequest, res) => {
  const { filename, fileData, mimeType } = req.body;

  if (!fileData || !filename) {
    res.status(400).json({ error: 'File data and filename are required.' });
    return;
  }

  // Validate MIME types
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (mimeType && !allowedMime.includes(mimeType)) {
    res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, PDF.' });
    return;
  }

  // Max 5MB check on base64 string
  if (fileData.length > 7 * 1024 * 1024) {
    res.status(400).json({ error: 'File exceeds 5MB size limit.' });
    return;
  }

  // In this serverless/in-memory build, store as standardized data URI or safe object URL
  const safeFilename = `${Date.now()}-${slugify(filename)}`;
  const url = fileData.startsWith('data:') ? fileData : `data:${mimeType || 'image/jpeg'};base64,${fileData}`;

  res.json({
    url,
    filename: safeFilename,
    size: Math.round((fileData.length * 3) / 4),
  });
});

// ----------------------------------------------------
// PROPERTIES (PUBLIC & SANITIZED)
// ----------------------------------------------------

apiRouter.get('/properties', optionalAuth, (req: AuthRequest, res) => {
  const {
    keyword,
    state,
    category,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    page = '1',
    limit = '20',
  } = req.query;

  // Recompute visibility before returning
  dbStore.recomputeAllPropertiesVisibility();

  // Public listings must strictly have isPublic: true and isDeleted: false
  let results = dbStore.getProperties().filter((p) => p.isPublic && !p.isDeleted);

  // Filters
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.location.area.toLowerCase().includes(kw) ||
        p.location.city.toLowerCase().includes(kw) ||
        (p.location.estate && p.location.estate.toLowerCase().includes(kw))
    );
  }

  if (state) {
    results = results.filter((p) => p.location.state === state);
  }

  if (category) {
    results = results.filter((p) => p.category === category);
  }

  if (propertyType) {
    results = results.filter((p) => p.propertyType === propertyType);
  }

  if (minPrice) {
    results = results.filter((p) => p.price.amount >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter((p) => p.price.amount <= Number(maxPrice));
  }

  if (bedrooms) {
    results = results.filter((p) => (p.specifications.bedrooms || 0) >= Number(bedrooms));
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
  const total = results.length;
  const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // CRITICAL SECURITY INVARIANT:
  // Quarantine all privateDetails, exactAddress, cadastralNumber, owner phone/email before returning to visitor!
  const sanitized = paginated.map((p) => dbStore.sanitizePublicProperty(p));

  res.json({
    data: sanitized,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

apiRouter.get('/properties/:id', optionalAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const prop = dbStore.getPropertyById(id);

  if (!prop || prop.isDeleted) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  const isOwner = req.user && req.user.uid === prop.submittedBy;
  const isAdmin = req.user && req.user.role === 'ADMIN';

  // If not public and not owner/admin, forbid
  if (!prop.isPublic && !isOwner && !isAdmin) {
    res.status(404).json({ error: 'Property not available or pending approval.' });
    return;
  }

  // If owner or admin, return full property including private details
  if (isOwner || isAdmin) {
    res.json(prop);
    return;
  }

  // Otherwise, sanitize completely!
  res.json(dbStore.sanitizePublicProperty(prop));
});

// Authenticated user's properties (drafts, pending review, live)
apiRouter.get('/my-properties', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.uid;
  const myProps = dbStore.getProperties().filter((p) => p.submittedBy === userId && !p.isDeleted);
  res.json(myProps);
});

// ----------------------------------------------------
// PRIVATE DRAFTS & LIFECYCLE (Owner Isolated)
// ----------------------------------------------------

apiRouter.post('/properties/draft', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role !== 'SELLER' && user.role !== 'DEVELOPER' && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only sellers and developers can create listings.' });
    return;
  }

  const draftData = req.body;
  const id = dbStore.nextPropertyId();
  const now = new Date().toISOString();

  const isDev = user.role === 'DEVELOPER';
  let devRecord: Developer | undefined;
  if (isDev) {
    devRecord = dbStore.getDevelopers().find((d) => d.userId === user.uid || d.developerId === user.developerId);
  }

  // Correct owner reference (DO NOT hardcode Eko Prime!)
  const ownerName = isDev
    ? (devRecord?.companyName || user.lastName || 'Developer Enterprise')
    : `${user.firstName} ${user.lastName}`.trim();

  const newDraft: Property = {
    id,
    slug: `${slugify(draftData.title || 'untitled-listing')}-${id.toLowerCase()}`,
    title: draftData.title || '',
    category: draftData.category || 'HOUSE',
    propertyType: draftData.propertyType || 'DETACHED_DUPLEX',
    price: draftData.price || { amount: 0, currency: 'NGN', negotiable: true },
    location: draftData.location || {
      state: user.state || 'Lagos',
      stateSlug: slugify(user.state || 'lagos'),
      city: user.city || 'Lekki',
      citySlug: slugify(user.city || 'lekki'),
      area: '',
      areaSlug: '',
    },
    specifications: draftData.specifications || {},
    description: draftData.description || '',
    features: draftData.features || [],
    images: draftData.images || [],
    coverImageUrl: draftData.coverImageUrl || draftData.images?.[0]?.url || '',
    ownerRef: {
      type: isDev ? 'DEVELOPER' : 'SELLER',
      id: isDev ? (devRecord?.developerId || user.developerId || user.uid) : user.uid,
      ownerName,
      developerSlug: isDev ? devRecord?.slug : undefined,
      developerName: isDev ? devRecord?.companyName : undefined,
    },
    privateDetails: draftData.privateDetails || {
      exactAddress: draftData.exactAddress || '',
      ownershipDetails: `Submitted by account ${user.uid}`,
      submittedKycDoc: draftData.kycDocUrl,
    },
    submittedBy: user.uid,
    status: 'DRAFT',
    availability: 'AVAILABLE',
    isPublic: false,
    isDeleted: false,
    hasPendingChange: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addProperty(newDraft);
  res.status(201).json(newDraft);
});

apiRouter.put('/properties/draft/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  // Ownership check
  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'You do not own this property.' });
    return;
  }

  // High finding #10: Allow editing both DRAFT and REJECTED properties!
  if (prop.status !== 'DRAFT' && prop.status !== 'REJECTED') {
    res.status(400).json({
      error: `Only listings in DRAFT or REJECTED status can be updated directly. (Current status: ${prop.status}). Use Change Request for LIVE listings.`,
    });
    return;
  }

  const updates = req.body;
  const safeUpdates: Partial<Property> = {
    title: updates.title ?? prop.title,
    category: updates.category ?? prop.category,
    propertyType: updates.propertyType ?? prop.propertyType,
    price: updates.price ?? prop.price,
    location: updates.location ?? prop.location,
    specifications: updates.specifications ?? prop.specifications,
    description: updates.description ?? prop.description,
    features: updates.features ?? prop.features,
    images: updates.images ?? prop.images,
    coverImageUrl: updates.coverImageUrl ?? prop.coverImageUrl,
    privateDetails: updates.privateDetails ?? prop.privateDetails,
    updatedAt: new Date().toISOString(),
  };

  const updated = dbStore.updateProperty(id, safeUpdates);
  res.json(updated);
});

apiRouter.delete('/properties/draft/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'You do not own this property.' });
    return;
  }

  if (prop.status !== 'DRAFT' && prop.status !== 'REJECTED') {
    res.status(400).json({ error: 'Cannot delete a published or under-review property directly.' });
    return;
  }

  dbStore.deleteProperty(id);
  res.json({ success: true, message: 'Draft deleted.' });
});

// SUBMIT DRAFT FOR ADMIN REVIEW -> Creates PROPERTY_SUBMIT Change Request
apiRouter.post('/properties/:id/submit', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  // Ownership check
  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'You do not have permission to submit this property.' });
    return;
  }

  // Status check: must be DRAFT or REJECTED
  if (prop.status !== 'DRAFT' && prop.status !== 'REJECTED') {
    res.status(400).json({
      error: `Property cannot be submitted. Current status: ${prop.status}. Only DRAFT or REJECTED listings can be submitted.`,
    });
    return;
  }

  // One pending request per target enforcement!
  if (prop.hasPendingChange) {
    res.status(400).json({
      error: 'A pending change request is already active for this property. Await administrator decision.',
    });
    return;
  }

  // Validation: prevent junk submissions reaching queue
  if (!prop.title || prop.title.trim().length < 5) {
    res.status(400).json({ error: 'Property title must be at least 5 characters long.' });
    return;
  }
  if (!prop.price || prop.price.amount <= 0) {
    res.status(400).json({ error: 'Property price must be greater than ₦0.' });
    return;
  }
  if (!prop.location?.state || !prop.location?.city || !prop.location?.area) {
    res.status(400).json({ error: 'Complete location (State, City, and Area) is required.' });
    return;
  }
  if (!prop.images || prop.images.length === 0) {
    res.status(400).json({ error: 'At least one verified property photograph is required.' });
    return;
  }

  const crId = dbStore.nextChangeRequestId();
  const now = new Date().toISOString();

  // Create PROPERTY_SUBMIT change request
  const cr: ChangeRequest = {
    id: crId,
    type: 'PROPERTY_SUBMIT',
    targetType: 'PROPERTY',
    targetId: prop.id,
    targetTitle: prop.title,
    requestedBy: user.uid,
    requesterName: `${user.firstName} ${user.lastName}`.trim(),
    requesterRole: user.role,
    proposedData: {
      status: 'LIVE',
      isPublic: true,
      title: prop.title,
      price: prop.price,
      category: prop.category,
      propertyType: prop.propertyType,
      location: prop.location,
      specifications: prop.specifications,
      description: prop.description,
      features: prop.features,
      images: prop.images,
      coverImageUrl: prop.coverImageUrl,
    },
    previousData: { status: prop.status, isPublic: false },
    baseVersion: prop.version,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addChangeRequest(cr);

  // Lock target property into PENDING_REVIEW
  dbStore.updateProperty(prop.id, {
    status: 'PENDING_REVIEW',
    hasPendingChange: true,
    pendingChangeId: crId,
    lastDecisionReason: undefined,
    updatedAt: now,
  });

  // Admin notification
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: 'admin-1',
    title: 'New Property Submission',
    message: `${cr.requesterName} submitted "${prop.title}" (${prop.id}) for review.`,
    linkTo: '/admin',
    read: false,
    createdAt: now,
  });

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: user.uid,
    actorName: cr.requesterName,
    actorRole: user.role,
    action: 'SUBMIT_PROPERTY_DRAFT',
    entityType: 'PROPERTY',
    entityId: prop.id,
    details: `Submitted property draft for admin review (Change Request: ${crId}).`,
    timestamp: now,
  });

  res.json({
    success: true,
    message: 'Property submitted for review.',
    changeRequestId: crId,
  });
});

// LIVE PROPERTY EDIT REQUEST -> Creates PROPERTY_EDIT Change Request
apiRouter.post('/properties/:id/request-edit', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  // Ownership check
  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'You do not have permission to edit this property.' });
    return;
  }

  if (prop.status !== 'LIVE') {
    res.status(400).json({ error: 'Only LIVE properties require edit change requests. Use draft edit for unapproved properties.' });
    return;
  }

  // One pending request per target!
  if (prop.hasPendingChange) {
    res.status(400).json({
      error: 'A pending change request is already active for this listing. Please wait for administration review.',
    });
    return;
  }

  const rawProposed = req.body.proposedData;
  if (!rawProposed || typeof rawProposed !== 'object') {
    res.status(400).json({ error: 'proposedData object is required.' });
    return;
  }

  // Field whitelisting & validation
  const proposedData: Record<string, any> = {};
  for (const key of ALLOWED_PROPERTY_EDIT_FIELDS) {
    if (key in rawProposed) {
      proposedData[key] = rawProposed[key];
    }
  }

  if (proposedData.price && (!proposedData.price.amount || proposedData.price.amount <= 0)) {
    res.status(400).json({ error: 'Proposed price must be greater than ₦0.' });
    return;
  }

  const crId = dbStore.nextChangeRequestId();
  const now = new Date().toISOString();

  const cr: ChangeRequest = {
    id: crId,
    type: 'PROPERTY_EDIT',
    targetType: 'PROPERTY',
    targetId: prop.id,
    targetTitle: prop.title,
    requestedBy: user.uid,
    requesterName: `${user.firstName} ${user.lastName}`.trim(),
    requesterRole: user.role,
    proposedData,
    previousData: {
      title: prop.title,
      price: prop.price,
      description: prop.description,
      features: prop.features,
    },
    baseVersion: prop.version,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addChangeRequest(cr);

  // Mark property with pending change lock (Live data remains UNTOUCHED on public site!)
  dbStore.updateProperty(prop.id, {
    hasPendingChange: true,
    pendingChangeId: crId,
    updatedAt: now,
  });

  // Admin notification
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: 'admin-1',
    title: 'Property Modification Request',
    message: `${cr.requesterName} submitted edits for live property "${prop.title}".`,
    linkTo: '/admin',
    read: false,
    createdAt: now,
  });

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: user.uid,
    actorName: cr.requesterName,
    actorRole: user.role,
    action: 'REQUEST_PROPERTY_EDIT',
    entityType: 'PROPERTY',
    entityId: prop.id,
    details: `Submitted modification request (Change Request: ${crId}). Live listing remains unchanged pending review.`,
    timestamp: now,
  });

  res.json({
    success: true,
    message: 'Edit request submitted for admin review.',
    changeRequestId: crId,
  });
});

// LIVE PROPERTY DELETE REQUEST
apiRouter.post('/properties/:id/request-delete', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  if (prop.hasPendingChange) {
    res.status(400).json({ error: 'A pending change request is already active for this property.' });
    return;
  }

  const { reason } = req.body;
  const crId = dbStore.nextChangeRequestId();
  const now = new Date().toISOString();

  const cr: ChangeRequest = {
    id: crId,
    type: 'PROPERTY_DELETE',
    targetType: 'PROPERTY',
    targetId: prop.id,
    targetTitle: prop.title,
    requestedBy: user.uid,
    requesterName: `${user.firstName} ${user.lastName}`.trim(),
    requesterRole: user.role,
    proposedData: { isDeleted: true, deleteReason: reason || 'Owner request' },
    previousData: { isDeleted: false },
    baseVersion: prop.version,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addChangeRequest(cr);

  dbStore.updateProperty(prop.id, {
    hasPendingChange: true,
    pendingChangeId: crId,
  });

  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: 'admin-1',
    title: 'Listing Deletion Request',
    message: `${cr.requesterName} requested deletion of "${prop.title}".`,
    linkTo: '/admin',
    read: false,
    createdAt: now,
  });

  res.json({ success: true, changeRequestId: crId });
});

// LIVE PROPERTY MARK SOLD REQUEST
apiRouter.post('/properties/:id/mark-sold', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const prop = dbStore.getPropertyById(id);

  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  if (prop.submittedBy !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Permission denied.' });
    return;
  }

  if (prop.hasPendingChange) {
    res.status(400).json({ error: 'A pending change request is already active for this property.' });
    return;
  }

  const crId = dbStore.nextChangeRequestId();
  const now = new Date().toISOString();

  const cr: ChangeRequest = {
    id: crId,
    type: 'PROPERTY_EDIT',
    targetType: 'PROPERTY',
    targetId: prop.id,
    targetTitle: `${prop.title} (Mark as Sold)`,
    requestedBy: user.uid,
    requesterName: `${user.firstName} ${user.lastName}`.trim(),
    requesterRole: user.role,
    proposedData: { availability: 'SOLD', isPublic: false },
    previousData: { availability: prop.availability, isPublic: prop.isPublic },
    baseVersion: prop.version,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addChangeRequest(cr);

  dbStore.updateProperty(prop.id, {
    hasPendingChange: true,
    pendingChangeId: crId,
  });

  res.json({ success: true, changeRequestId: crId });
});

// ----------------------------------------------------
// DEVELOPERS & DEVELOPER SPACES
// ----------------------------------------------------

apiRouter.get('/developers', (_req, res) => {
  dbStore.recomputeAllPropertiesVisibility();
  const allDevs = dbStore.getDevelopers();
  const allProps = dbStore.getProperties();

  // Developers with >= 2 live public properties unlock public Developer Spaces
  const verifiedDevs = allDevs.map((dev) => {
    const liveCount = allProps.filter(
      (p) => p.ownerRef.id === dev.developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
    ).length;

    // Quarantine sensitive contact phone/email for public directory
    return {
      developerId: dev.developerId,
      slug: dev.slug,
      companyName: dev.companyName,
      cacNumber: dev.cacNumber,
      logoUrl: dev.logoUrl,
      bannerUrl: dev.bannerUrl,
      businessOverview: dev.businessOverview,
      verificationStatus: dev.verificationStatus,
      propertiesCount: liveCount,
      hasDeveloperSpace: liveCount >= 2,
      accreditationTier: dev.accreditationTier,
      joinedAt: dev.joinedAt,
    };
  });

  res.json(verifiedDevs);
});

apiRouter.get('/developers/:slug', (req, res) => {
  const { slug } = req.params;
  const dev = dbStore.getDeveloperBySlug(slug);

  if (!dev) {
    res.status(404).json({ error: 'Developer not found.' });
    return;
  }

  dbStore.recomputeAllPropertiesVisibility();
  const liveProperties = dbStore
    .getProperties()
    .filter(
      (p) => p.ownerRef.id === dev.developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
    )
    .map((p) => dbStore.sanitizePublicProperty(p));

  // Anti-disintermediation: direct contactPhone and contactEmail quarantined
  const safeDeveloper = {
    developerId: dev.developerId,
    slug: dev.slug,
    companyName: dev.companyName,
    cacNumber: dev.cacNumber,
    logoUrl: dev.logoUrl,
    bannerUrl: dev.bannerUrl,
    businessOverview: dev.businessOverview,
    verificationStatus: dev.verificationStatus,
    propertiesCount: liveProperties.length,
    hasDeveloperSpace: liveProperties.length >= 2,
    accreditationTier: dev.accreditationTier,
    joinedAt: dev.joinedAt,
  };

  res.json({
    developer: safeDeveloper,
    properties: liveProperties,
  });
});

// ----------------------------------------------------
// USER CART (Isolated, persistent per-user)
// ----------------------------------------------------

apiRouter.get('/cart', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  // Resolve IDs strictly against public live properties!
  const publicIds = new Set(
    dbStore
      .getProperties()
      .filter((p) => p.isPublic && !p.isDeleted)
      .map((p) => p.id)
  );

  const safeCartIds = user.cart.filter((id) => publicIds.has(id));
  const properties = safeCartIds
    .map((id) => dbStore.getPropertyById(id))
    .filter(Boolean)
    .map((p) => dbStore.sanitizePublicProperty(p!));

  res.json({
    cartIds: safeCartIds,
    properties,
  });
});

apiRouter.post('/cart/toggle', requireAuth, (req: AuthRequest, res) => {
  const { propertyId } = req.body;
  const user = req.user!;

  const targetProp = dbStore.getPropertyById(propertyId);
  if (!targetProp || !targetProp.isPublic || targetProp.isDeleted) {
    res.status(400).json({ error: 'Only live public properties can be saved to your cart.' });
    return;
  }

  let newCart = [...user.cart];
  if (newCart.includes(propertyId)) {
    newCart = newCart.filter((id) => id !== propertyId);
  } else {
    newCart.push(propertyId);
  }

  dbStore.updateUser(user.uid, { cart: newCart });
  res.json({ cartIds: newCart });
});

// ----------------------------------------------------
// INQUIRIES & CONCIERGE MESSAGING
// ----------------------------------------------------

const REALTO_WHATSAPP_NUMBER = '2348007325866'; // Realto Admin Concierge

apiRouter.post('/enquiries', requireAuth, (req: AuthRequest, res) => {
  const { propertyId, messageBody } = req.body;
  const user = req.user!;

  if (!propertyId || !messageBody || !messageBody.trim()) {
    res.status(400).json({ error: 'Property ID and message are required.' });
    return;
  }

  const prop = dbStore.getPropertyById(propertyId);
  if (!prop || !prop.isPublic || prop.isDeleted) {
    res.status(400).json({ error: 'Inquiries can only be made on verified live properties.' });
    return;
  }

  const threadId = dbStore.nextThreadId();
  const msgId = dbStore.nextMessageId();
  const now = new Date().toISOString();
  const buyerName = `${user.firstName} ${user.lastName}`.trim();

  const firstMsg: Message = {
    id: msgId,
    threadId,
    senderId: user.uid,
    senderName: buyerName,
    senderRole: user.role,
    body: messageBody.trim(),
    createdAt: now,
  };

  const newThread: Thread = {
    id: threadId,
    kind: 'ENQUIRY',
    propertyId: prop.id,
    propertyTitle: prop.title,
    userId: user.uid,
    userName: buyerName,
    userEmail: user.email,
    userPhone: user.phone,
    userRole: user.role,
    status: 'NEW',
    unreadForAdmin: true,
    unreadForUser: false,
    lastMessageAt: now,
    lastMessageSnippet: messageBody.slice(0, 80) + '...',
    messages: [firstMsg],
    createdAt: now,
    updatedAt: now,
  };

  dbStore.addThread(newThread);

  // Admin Notification
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: 'admin-1',
    title: 'New Property Inquiry',
    message: `${buyerName} submitted an inquiry for ${prop.id} (${prop.title}).`,
    linkTo: '/admin',
    read: false,
    createdAt: now,
  });

  // Pre-filled WhatsApp click-to-chat URL strictly to Realto Admin Concierge!
  const waText = encodeURIComponent(
    `Hello Realto Admin Concierge,\n\nI am interested in inspecting property ID: ${prop.id} (${prop.title}) located in ${prop.location.area}, ${prop.location.city}.\n\nMy Name: ${buyerName}\nMy Contact: ${user.phone}\nMy Inquiry: "${messageBody.trim()}"`
  );
  const whatsappUrl = `https://wa.me/${REALTO_WHATSAPP_NUMBER}?text=${waText}`;

  res.status(201).json({
    thread: newThread,
    whatsappUrl,
  });
});

apiRouter.get('/threads', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  let threads = dbStore.getThreads();

  // Non-admins ONLY see threads they participate in!
  if (user.role !== 'ADMIN') {
    threads = threads.filter((t) => t.userId === user.uid);
  }

  res.json(threads);
});

apiRouter.post('/threads/:id/messages', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { body } = req.body;
  const user = req.user!;

  if (!body || !body.trim()) {
    res.status(400).json({ error: 'Message body cannot be empty.' });
    return;
  }

  const thread = dbStore.getThreadById(id);
  if (!thread) {
    res.status(404).json({ error: 'Thread not found.' });
    return;
  }

  // Access control
  if (thread.userId !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden. You are not a participant in this conversation.' });
    return;
  }

  // Closed thread protection!
  if (thread.status === 'CLOSED') {
    res.status(400).json({
      error: 'This thread is closed. Please submit a new inquiry or contact support to reopen.',
    });
    return;
  }

  const now = new Date().toISOString();
  const isAdmin = user.role === 'ADMIN';

  const newMsg: Message = {
    id: dbStore.nextMessageId(),
    threadId: thread.id,
    senderId: user.uid,
    senderName: `${user.firstName} ${user.lastName}`.trim(),
    senderRole: user.role,
    body: body.trim(),
    createdAt: now,
  };

  const updatedThread = dbStore.updateThread(id, {
    status: isAdmin ? 'IN_PROGRESS' : 'OPEN',
    unreadForAdmin: !isAdmin,
    unreadForUser: isAdmin,
    lastMessageAt: now,
    lastMessageSnippet: body.slice(0, 80) + '...',
    messages: [...thread.messages, newMsg],
    updatedAt: now,
  });

  // Notify counterparty
  const recipientId = isAdmin ? thread.userId : 'admin-1';
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId,
    title: `New reply on inquiry (${thread.propertyTitle || 'Conversation'})`,
    message: `${user.firstName}: "${body.slice(0, 60)}..."`,
    linkTo: '/dashboard',
    read: false,
    createdAt: now,
  });

  res.json(updatedThread);
});

apiRouter.post('/threads/:id/close', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;
  const thread = dbStore.getThreadById(id);

  if (!thread) {
    res.status(404).json({ error: 'Thread not found.' });
    return;
  }

  if (thread.userId !== user.uid && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }

  const updated = dbStore.updateThread(id, {
    status: 'CLOSED',
    updatedAt: new Date().toISOString(),
  });

  res.json(updated);
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------

apiRouter.get('/notifications', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const myNotifs = dbStore.getNotifications().filter((n) => n.recipientId === user.uid);
  res.json(myNotifs);
});

apiRouter.post('/notifications/:id/read', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  dbStore.markNotificationAsRead(id);
  res.json({ success: true });
});

// ----------------------------------------------------
// ADMIN GOVERNANCE ENGINE (Admin Only)
// ----------------------------------------------------

apiRouter.get('/admin/change-requests', requireAdmin, (_req, res) => {
  res.json(dbStore.getChangeRequests());
});

apiRouter.post('/admin/change-requests/:id/approve', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const admin = req.user!;
  const cr = dbStore.getChangeRequestById(id);

  if (!cr) {
    res.status(404).json({ error: 'Change Request not found.' });
    return;
  }

  if (cr.status !== 'PENDING') {
    res.status(400).json({ error: `Change Request already finalized with status: ${cr.status}.` });
    return;
  }

  const now = new Date().toISOString();

  if (cr.type === 'PROPERTY_SUBMIT') {
    const prop = dbStore.getPropertyById(cr.targetId);
    if (!prop) {
      res.status(404).json({ error: 'Target property not found.' });
      return;
    }

    // Check target owner status!
    const owner = dbStore.getUserById(prop.submittedBy);
    const isOwnerActive = owner?.accountStatus === 'ACTIVE';

    // Whitelist and merge proposed data safely
    const proposed = cr.proposedData || {};
    const safeUpdates: Partial<Property> = {
      status: 'LIVE',
      // High finding #6: Pending accounts can NOT go public!
      isPublic: isOwnerActive && prop.availability === 'AVAILABLE' && !prop.isDeleted,
      hasPendingChange: false,
      pendingChangeId: undefined,
      lastDecisionReason: undefined,
      approvedAt: now,
      updatedAt: now,
      version: prop.version + 1,
    };

    for (const key of ALLOWED_PROPERTY_EDIT_FIELDS) {
      if (key in proposed) {
        (safeUpdates as any)[key] = proposed[key];
      }
    }

    dbStore.updateProperty(prop.id, safeUpdates);

    // Update developer live properties count & space status
    if (prop.ownerRef.type === 'DEVELOPER') {
      const dev = dbStore.getDevelopers().find((d) => d.developerId === prop.ownerRef.id);
      if (dev) {
        const liveCount = dbStore
          .getProperties()
          .filter((p) => p.ownerRef.id === dev.developerId && p.status === 'LIVE' && p.isPublic).length;
        dbStore.updateDeveloper(dev.developerId, {
          livePropertiesCount: liveCount,
          hasDeveloperSpace: liveCount >= 2,
        });
      }
    }
  } else if (cr.type === 'PROPERTY_EDIT') {
    const prop = dbStore.getPropertyById(cr.targetId);
    if (!prop) {
      res.status(404).json({ error: 'Target property not found.' });
      return;
    }

    // Check baseVersion to detect concurrent conflict
    if (cr.baseVersion && cr.baseVersion !== prop.version) {
      console.warn(`Version conflict warning on ${prop.id}: cr.baseVersion=${cr.baseVersion}, prop.version=${prop.version}`);
    }

    const proposed = cr.proposedData || {};
    const safeUpdates: Partial<Property> = {
      hasPendingChange: false,
      pendingChangeId: undefined,
      lastDecisionReason: undefined,
      updatedAt: now,
      version: prop.version + 1,
    };

    // Whitelist merge
    for (const key of ALLOWED_PROPERTY_EDIT_FIELDS) {
      if (key in proposed) {
        (safeUpdates as any)[key] = proposed[key];
      }
    }

    if (proposed.availability) {
      safeUpdates.availability = proposed.availability;
      if (proposed.availability === 'SOLD') {
        safeUpdates.isPublic = false;
      }
    }

    dbStore.updateProperty(prop.id, safeUpdates);
  } else if (cr.type === 'PROPERTY_DELETE') {
    dbStore.updateProperty(cr.targetId, {
      isDeleted: true,
      isPublic: false,
      hasPendingChange: false,
      pendingChangeId: undefined,
      deletedAt: now,
      deletedBy: admin.uid,
      updatedAt: now,
    });
  } else if (cr.type === 'ACCOUNT_REGISTRATION') {
    // Approve user account
    const user = dbStore.updateUser(cr.targetId, {
      accountStatus: 'ACTIVE',
      updatedAt: now,
    });

    if (user && user.role === 'DEVELOPER') {
      dbStore.updateDeveloper(user.uid, {
        verificationStatus: 'VERIFIED',
        verifiedAt: now,
      });
    }

    // Recalculate visibility for all user's listings!
    dbStore.recomputeAllPropertiesVisibility();
  }

  // Update change request
  dbStore.updateChangeRequest(id, {
    status: 'APPROVED',
    decisionBy: admin.uid,
    decisionAt: now,
    updatedAt: now,
  });

  // Audit log
  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: `APPROVE_${cr.type}`,
    entityType: cr.targetType,
    entityId: cr.targetId,
    details: `Approved ${cr.type} request (${id}) for "${cr.targetTitle || cr.targetId}".`,
    timestamp: now,
  });

  // Requester notification
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: cr.requestedBy,
    title: 'Change Request Approved!',
    message: `Your ${cr.type.toLowerCase().replace('_', ' ')} for "${cr.targetTitle || cr.targetId}" was approved by Admin.`,
    linkTo: '/dashboard',
    read: false,
    createdAt: now,
  });

  res.json({ success: true, message: 'Change Request approved atomically.' });
});

apiRouter.post('/admin/change-requests/:id/reject', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin = req.user!;

  if (!reason || reason.trim().length < 8) {
    res.status(400).json({ error: 'A clear written rejection reason is mandatory (minimum 8 characters).' });
    return;
  }

  const cr = dbStore.getChangeRequestById(id);
  if (!cr) {
    res.status(404).json({ error: 'Change Request not found.' });
    return;
  }

  if (cr.status !== 'PENDING') {
    res.status(400).json({ error: `Change Request already finalized with status: ${cr.status}.` });
    return;
  }

  const now = new Date().toISOString();

  if (cr.type === 'PROPERTY_SUBMIT') {
    // High finding #10: Set status to REJECTED so the user can edit and resubmit!
    dbStore.updateProperty(cr.targetId, {
      status: 'REJECTED',
      hasPendingChange: false,
      pendingChangeId: undefined,
      lastDecisionReason: reason.trim(),
      updatedAt: now,
    });
  } else if (cr.type === 'ACCOUNT_REGISTRATION') {
    // High finding #10: Rejecting registration sets account to REJECTED
    dbStore.updateUser(cr.targetId, {
      accountStatus: 'REJECTED',
      updatedAt: now,
    });
  } else {
    // PROPERTY_EDIT or PROPERTY_DELETE: Release lock, preserve live data
    dbStore.updateProperty(cr.targetId, {
      hasPendingChange: false,
      pendingChangeId: undefined,
      lastDecisionReason: reason.trim(),
      updatedAt: now,
    });
  }

  dbStore.updateChangeRequest(id, {
    status: 'REJECTED',
    decisionReason: reason.trim(),
    decisionBy: admin.uid,
    decisionAt: now,
    updatedAt: now,
  });

  // Audit log
  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: `REJECT_${cr.type}`,
    entityType: cr.targetType,
    entityId: cr.targetId,
    details: `Rejected ${cr.type} request (${id}). Reason: ${reason.trim()}`,
    timestamp: now,
  });

  // Notification
  dbStore.addNotification({
    id: dbStore.nextNotificationId(),
    recipientId: cr.requestedBy,
    title: 'Review Decision: Corrections Needed',
    message: `Admin review on "${cr.targetTitle || cr.targetId}": ${reason.trim()}`,
    linkTo: '/dashboard',
    read: false,
    createdAt: now,
  });

  res.json({ success: true, message: 'Change Request rejected with recorded audit reason.' });
});

// Admin User Management
apiRouter.get('/admin/users', requireAdmin, (_req, res) => {
  const users = dbStore.getUsers().map(({ passwordHash: _, salt: __, ...safe }) => safe);
  res.json(users);
});

apiRouter.post('/admin/users/:id/suspend', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin = req.user!;

  if (!reason || !reason.trim()) {
    res.status(400).json({ error: 'A suspension reason is mandatory.' });
    return;
  }

  const user = dbStore.updateUser(id, { accountStatus: 'SUSPENDED' });
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // Immediately hide all user listings from the marketplace
  dbStore.recomputeAllPropertiesVisibility();

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: 'SUSPEND_USER',
    entityType: 'USER',
    entityId: id,
    details: `User suspended. Reason: ${reason.trim()}. All listings immediately hidden.`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'User suspended and listings hidden.' });
});

apiRouter.post('/admin/users/:id/reactivate', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const admin = req.user!;

  const user = dbStore.updateUser(id, { accountStatus: 'ACTIVE' });
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  // High finding #12: Reactivate only restores listings that were LIVE, AVAILABLE, and NOT UNPUBLISHED!
  dbStore.recomputeAllPropertiesVisibility();

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: 'REACTIVATE_USER',
    entityType: 'USER',
    entityId: id,
    details: 'User reactivated to ACTIVE status. Standard live listings restored (unpublished listings remain private).',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, message: 'User reactivated.' });
});

// Admin Property Visibility & Availability Governance
apiRouter.post('/admin/properties/:id/toggle-visibility', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { isPublic, reason } = req.body;
  const admin = req.user!;

  if (!reason || !reason.trim()) {
    res.status(400).json({ error: 'Admin reason is required for visibility overrides.' });
    return;
  }

  const prop = dbStore.getPropertyById(id);
  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  const now = new Date().toISOString();

  // High finding #12: Use UNPUBLISHED status cleanly rather than arbitrary flags!
  if (!isPublic) {
    dbStore.updateProperty(id, {
      status: 'UNPUBLISHED',
      isPublic: false,
      updatedAt: now,
    });
  } else {
    // If making public, verify owner is ACTIVE!
    const owner = dbStore.getUserById(prop.submittedBy);
    if (owner?.accountStatus !== 'ACTIVE') {
      res.status(400).json({ error: 'Cannot publish listing: Owner account is not ACTIVE.' });
      return;
    }
    dbStore.updateProperty(id, {
      status: 'LIVE',
      isPublic: true,
      updatedAt: now,
    });
  }

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: isPublic ? 'ADMIN_PUBLISH_PROPERTY' : 'ADMIN_UNPUBLISH_PROPERTY',
    entityType: 'PROPERTY',
    entityId: id,
    details: `Listing visibility set to ${isPublic ? 'PUBLIC' : 'UNPUBLISHED'}. Reason: ${reason.trim()}`,
    timestamp: now,
  });

  res.json({ success: true, isPublic });
});

apiRouter.post('/admin/properties/:id/set-availability', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { availability } = req.body;
  const admin = req.user!;

  const prop = dbStore.getPropertyById(id);
  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  const isPublic = availability === 'AVAILABLE' && prop.status === 'LIVE' && !prop.isDeleted;
  const updated = dbStore.updateProperty(id, {
    availability,
    isPublic,
    updatedAt: new Date().toISOString(),
  });

  dbStore.addAuditLog({
    id: dbStore.nextAuditLogId(),
    actorId: admin.uid,
    actorName: `${admin.firstName} ${admin.lastName}`.trim(),
    actorRole: 'ADMIN',
    action: 'ADMIN_SET_AVAILABILITY',
    entityType: 'PROPERTY',
    entityId: id,
    details: `Listing availability set to ${availability}.`,
    timestamp: new Date().toISOString(),
  });

  res.json(updated);
});

apiRouter.get('/admin/audit-logs', requireAdmin, (_req, res) => {
  res.json(dbStore.getAuditLogs());
});

apiRouter.post('/admin/reset-database', requireAdmin, (_req, res) => {
  dbStore.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial seed data.' });
});
