# REALTO — Developer Guide & Technical Specification

**Version:** 2.1 (Updated with Developer Spaces, Private Draft vs. Live Data Isolation, Pending Account Dashboard Access, and Streamlined Admin Scope)  
**Product:** Admin-governed Nigerian real-estate marketplace  
**Stack:** Next.js (App Router, TypeScript) on Vercel · Firebase Auth, Firestore, Storage · Resend (Transactional Email)  
**Location:** `/docs/REALTO-DEVELOPER-GUIDE.md`  
**Status:** Approved Technical Specification and Architecture Document.

---

## 1. Product Definition & Vision

Realto is an admin-governed Nigerian real-estate marketplace designed to eliminate property fraud, bait-and-switch listings, and disintermediation. The public browses verified properties without requiring an account. Registered Sellers and Developers can onboard, assemble property drafts, and submit listings. **Realto Platform Administration acts as the trusted escrow and centralized governing hub.**

### What the Platform Is:
- **Democratic Public Marketplace:** The home page presents an aggregated feed of individual, approved properties across all independent sellers and developers.
- **Dedicated Developer Spaces:** When a verified developer has **more than one approved live property**, they automatically receive their own dedicated, branded Developer Space (`/developer/[slug]`) showcasing their company overview and entire active portfolio.
- **Zero-Contact Privacy Shield:** Visitors never see the personal phone numbers, direct email addresses, or residential contacts of sellers or developers. All inquiries, inspections, and communication flow exclusively through Realto Admin.
- **Private Draft vs. Live Data Separation:** Owners can freely create, modify, and manage drafts in their private workspace without affecting live listings or triggering administrative reviews. Submitting a draft locks it and creates a formal `PROPERTY_SUBMIT` Change Request.
- **Immediate Dashboard Access:** When sellers and developers register, their accounts are created immediately in `PENDING_APPROVAL` status. They can instantly access their dashboards to explore features, view platform notifications, submit support messages, and prepare property drafts—with the strict guarantee that nothing goes live to the public until Admin approves both the account and the submissions.
- **Audited Change Requests:** Once a listing is live, no owner can directly alter live data. Every edit, price revision, or deletion is staged through an audited Change Request approved by Admin.
- **Immutable Business History:** Nothing is physically deleted from the database. Deletions are soft flags, preserving an unbroken audit trail of requests, approvals, and decisions.

### What the Platform Is Not (Current Build Scope):
- No rentals or lease listings (outright sales only).
- No direct buyer-to-seller or buyer-to-developer chat.
- No public seller contact cards or direct developer contact forms.
- No in-app video uploads (high-res photography only).
- No Super Admin tier (simplified single `ADMIN` role for this build round).

---

## 2. Core Governing Rules

1. **Admin is the Sole Live Authority:** Only Admin approval or direct Admin intervention can alter the public-facing state of the marketplace.
2. **Private Drafts are Free & Isolated:** Owners may create, edit, save, and delete draft properties in their private dashboard at will. Drafts never touch public indexes or require Change Requests.
3. **Every Live Modification is a Change Request:** Submitting a draft (`PROPERTY_SUBMIT`), modifying an active property (`PROPERTY_EDIT`), deleting a listing (`PROPERTY_DELETE`), profile updates (`PROFILE_EDIT`), and account closures (`ACCOUNT_DELETION`) require an audited Change Request.
4. **Immediate Dashboard Access for Pending Users:** Sellers and developers enter `PENDING_APPROVAL` upon registration. They can log in, view notifications, communicate with Admin, and draft properties immediately. However, their listings cannot be approved for live display until Admin approves their account verification.
5. **Developer Spaces for Multi-Listing Developers:** Developers with two or more approved live properties receive a dedicated public showcase page. However, **no contact details or personal data are exposed on Developer Spaces.**
6. **Unified Marketplace Index:** The home page aggregates individual property cards from both private sellers and corporate developers equally, sorted by freshness and relevance.
7. **Strict Admin Hub for Inquiries:** Buyers submit inquiries to Admin. Realto Admin inspects, verifies, and facilitates deals. The platform provides a pre-filled WhatsApp click-to-chat button pointing solely to the **Realto Support Concierge**.
8. **Soft Deletions Only:** Deleting a property or deactivating an account sets `isDeleted = true` / status flags. Records remain in Firestore for auditing and administrative compliance.
9. **Mandatory Justification for Rejections:** Any rejection of an account, property submission, or change request requires a written reason visible on the user's dashboard and dispatched via email.
10. **Public DTO Whitelisting:** Raw Firestore documents are never sent to the browser. All public routes pass through strict Data Transfer Object (DTO) transformers that strip private addresses, owner identities, KYC references, and internal admin notes.

---

## 3. Roles and Account Status Lifecycle

### 3.1 Roles (`config/roles.ts`)

| Role | Target Actor | Description |
|---|---|---|
| `PUBLIC` | Anonymous Visitor | Can browse index, filter catalog, view property details, view Developer Spaces, save guest cart. |
| `BUYER` | Registered Buyer | Can save persistent cart, submit property inquiries to Admin, track enquiry threads, manage profile. |
| `SELLER` | Individual Property Owner / Agent | Can manage private drafts, submit listings for review, view pending requests, message Admin via support. |
| `DEVELOPER` | Real Estate Construction / Development Firm | Corporate profile, private drafts, multi-property portfolio, Developer Space (when >1 live listing), support threads. |
| `ADMIN` | Platform Operator | Reviews Change Requests, approves/rejects accounts and listings, manages users, answers inquiries, handles support. |

*Note: `SUPER_ADMIN` has been omitted for this round of build. All governance and review operations are concentrated in `ADMIN`.*

### 3.2 Account Status

- `PENDING_APPROVAL`: Initial state for all newly registered `SELLER` and `DEVELOPER` accounts. Dashboard access is active; live publishing is disabled.
- `ACTIVE`: Fully approved account with unrestricted draft submission and live publishing privileges.
- `REJECTED`: Account registration rejected by Admin with written reason. User can view the reason, correct profile/documents, and request re-review.
- `SUSPENDED`: Temporarily disabled by Admin due to policy violations. All live properties owned by this user are immediately pulled from public view.
- `DEACTIVATED`: Soft-deleted account upon approved user request or administrative action.

---

## 4. Architecture & Data Boundary

```
[ Visitor / Client Browser ]
         │
         ├── Public Pages (Server Components): Home, Property Details, Developer Space
         ├── Interactive Widgets (Client Components): Search Filters, Cart, Draft Forms
         └── API Mutations (Route Handlers: /api/*)
                     │
            [ Next.js Service Layer ] (lib/services/*)
                     │
      ┌──────────────┼───────────────────────────┐
      │              │                           │
[ Firebase Auth ] [ Cloud Firestore ]     [ Firebase Storage ]     [ Resend Outbox ]
  (Identity &      (Admin SDK only;         (Private KYC/docs;       (Asynchronous
   Sessions)        Deny-all client)         Public approved imgs)    Notifications)
```

### Architectural Principles:
1. **Zero Client-Side Firestore SDK:** The client app never writes to or directly queries Firestore. All database operations execute through Next.js Server Components and Route Handlers utilizing `firebase-admin`.
2. **Deny-All Security Rules:** Firestore and Cloud Storage default rules deny all client read/write operations (with the sole exception of cached reads on `public/properties/**/images/**`).
3. **Isolated Business Services:** Business rules reside strictly within `lib/services/` (`properties.ts`, `change-requests.ts`, `visibility.ts`, `threads.ts`, `users.ts`, `developers.ts`).
4. **Public DTO Serialization:** The database model contains sensitive operational fields (KYC IDs, owner UID, exact street coordinates, seller phone numbers). The serializer (`lib/serializers/public-property.ts`) guarantees only safe public fields reach the client.

---

## 5. Private Draft Data vs. Live Data Architecture

This dual-tier data architecture ensures freedom for sellers and developers while maintaining ironclad integrity over what the public sees.

```
+-----------------------------------------------------------------------------------+
| OWNER DASHBOARD (Private Draft Workspace)                                         |
|                                                                                   |
|  [ Create Draft ] ──► [ Save & Reorder Images ] ──► [ Edit Specs ]                |
|         │                                                                         |
|         ▼                                                                         |
|  Status: DRAFT (isPublic: false, hasPendingChange: false)                         |
|  * Stored in `properties` collection                                             |
|  * Unapproved images in private/properties/{id}/images-pending/                   |
|  * Draft edits do NOT create Change Requests or trigger notifications             |
+-----------------------------------------------------------------------------------+
                                  │
                       [ Click "Submit for Review" ]
                                  │
                                  ▼
+-----------------------------------------------------------------------------------+
| CHANGE REQUEST ENGINE                                                             |
|                                                                                   |
|  1. Property status transitions from DRAFT ──► PENDING_REVIEW                     |
|  2. Change Request created: `PROPERTY_SUBMIT`                                     |
|  3. Lock placed: `hasPendingChange = true`, `pendingChangeId = requestId`        |
|  4. Admin Review Queue receives entry with deep inspection tools                  |
+-----------------------------------------------------------------------------------+
                                  │
                      [ Admin Approves Submission ]
                                  │
                                  ▼
+-----------------------------------------------------------------------------------+
| LIVE MARKETPLACE DATA                                                             |
|                                                                                   |
|  1. Normalized images copied to public/properties/{id}/images/                    |
|  2. Property status transitions to LIVE (`isPublic = true`)                       |
|  3. Listing appears on Home Page & Developer Space (if >1 live)                   |
|  4. Owner can no longer edit live fields directly!                                |
+-----------------------------------------------------------------------------------+
                                  │
                      [ Owner Needs to Update Price/Specs ]
                                  │
                                  ▼
+-----------------------------------------------------------------------------------+
| ONGOING EDIT CYCLE (PROPERTY_EDIT Change Request)                                 |
|                                                                                   |
|  1. Owner enters edit modal: current live data is displayed                       |
|  2. Saving creates a `PROPERTY_EDIT` Change Request                               |
|  3. Live listing REMAINS UNTOUCHED on public site (showing approved v1 data)      |
|  4. Admin views side-by-side diff (v1 vs proposed v2)                             |
|  5. If Approved: v2 replaces v1 in live record, version increments                |
|  6. If Rejected: v1 remains live, owner receives notification with reason         |
+-----------------------------------------------------------------------------------+
```

---

## 6. Public Marketplace & Developer Spaces

### 6.1 The Unified Home Index (`/`)
- Aggregates individual property cards from all active sellers and developers.
- Every card displays: Cover photo, Price (NGN, formatted), Title, Category badge, Property Type, General Location (State, City, Area), Bedroom/Bathroom counts (if residential), and a "Verified Listing" badge.
- **Card Privacy Rule:** No seller or developer name is displayed on the general card unless it is an accredited Developer Space link.

### 6.2 Developer Spaces (`/developer/[developerSlug]`)
- **Eligibility Trigger:** When a `DEVELOPER` account has **$\ge 2$ approved live properties** on Realto, the system automatically enables their public Developer Space.
- **Header Elements:**
  - Company Legal/Brand Name (e.g. *Eko Prime Developments Ltd*)
  - Corporate Logo & Header Banner
  - Verified Developer Accreditation Badge
  - Company Overview / Bio & Corporate Mission
  - Total Active Projects counter
- **Portfolio Grid:** Filterable catalog displaying exclusively that developer's approved live properties.
- **Strict Anti-Disintermediation Rule:**
  - **NO phone numbers, NO direct email addresses, NO physical office addresses, and NO external website links** are rendered on the Developer Space.
  - Visitors browsing a developer's listings who click **"Inquire"** or **"Book Inspection"** are routed to the central Realto Admin enquiry flow.

### 6.3 Property Detail Page (`/property/[slug]`)
- High-resolution image gallery (with fullscreen viewer and thumbnail navigation).
- General Location: State, City, Area, Estate (exact coordinates and street address remain in `propertyPrivate` collection).
- Specifications: Bedrooms, Bathrooms, Toilets, Land Size (sqm / plots), Title documentation type (e.g., C of O, Governor's Consent, Gazette).
- Features checklist: 24/7 Power, Treated Water, CCTV, Swimming Pool, BQ, etc.
- **Developer Link:** If the property belongs to a multi-listing developer, a banner appears: *"Part of the [Developer Name] Portfolio — Explore all projects by this developer"*, linking to their Developer Space.
- **Primary Actions:**
  1. **Add to Cart (Saved Properties):** Stores in guest storage or authenticated user profile.
  2. **Inquire to Realto Admin:** Opens the enquiry modal.

---

## 7. Data Model & Firestore Collections

All documents include standard metadata: `createdAt: Timestamp`, `updatedAt: Timestamp`, and an integer `version: number`.

### 7.1 `users/{uid}`
```typescript
interface UserDocument {
  uid: string;
  role: 'BUYER' | 'SELLER' | 'DEVELOPER' | 'ADMIN';
  accountStatus: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED';
  statusReason?: string; // Required when REJECTED or SUSPENDED
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    state?: string;
    city?: string;
  };
  emailLower: string;
  nameLower: string;
  sellerRelationship?: 'OWNER' | 'REPRESENTATIVE';
  representationDetails?: string;
  developerId?: string; // Populated for DEVELOPER role
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  version: number;
}
```

### 7.2 `developers/{developerId}`
```typescript
interface DeveloperDocument {
  developerId: string;
  userId: string;
  slug: string; // e.g. "eko-prime-developments"
  companyName: string;
  cacNumber: string; // Corporate Affairs Commission registration
  logoUrl?: string;
  bannerUrl?: string;
  companyAddress: string; // Private, visible to Admin only
  contactPerson: string;  // Private, visible to Admin only
  phone: string;          // Private, visible to Admin only
  email: string;          // Private, visible to Admin only
  website?: string;       // Private, visible to Admin only
  businessOverview: string; // Publicly visible on Developer Space
  livePropertiesCount: number; // Maintained counter
  hasDeveloperSpace: boolean; // Computed: livePropertiesCount >= 2
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 7.3 `properties/{propertyId}`
```typescript
interface PropertyDocument {
  id: string; // e.g. "RTL-00104"
  slug: string;
  title: string;
  category: 'HOUSE' | 'FLAT_APARTMENT' | 'LAND' | 'COMMERCIAL';
  propertyType: string; // e.g. "DETACHED_DUPLEX", "BLOCK_OF_FLATS"
  price: {
    amount: number;
    currency: 'NGN';
    negotiable: boolean;
  };
  location: {
    state: string;
    stateSlug: string;
    city: string;
    citySlug: string;
    area: string;
    areaSlug: string;
    estate?: string;
  };
  specifications: {
    bedrooms?: number;
    bathrooms?: number;
    toilets?: number;
    livingRooms?: number;
    parkingSpaces?: number;
    landSize?: number;
    landSizeUnit?: 'SQM' | 'PLOT' | 'HECTARE';
    buildingSize?: number;
    buildingSizeUnit?: 'SQM';
    floors?: number;
    bq?: boolean;
    titleDocument?: string; // e.g. "GOVERNORS_CONSENT", "C_OF_O"
  };
  description: string;
  features: string[];
  images: Array<{
    id: string;
    url: string;
    order: number;
    isCover: boolean;
  }>;
  coverImageUrl: string;

  // Ownership & Governance Controls
  ownerRef: {
    type: 'SELLER' | 'DEVELOPER';
    id: string; // uid or developerId
    ownerName: string; // Private
  };
  submittedBy: string; // uid
  status: 'DRAFT' | 'PENDING_REVIEW' | 'LIVE' | 'REJECTED' | 'UNPUBLISHED';
  availability: 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD';
  isPublic: boolean; // Stored computed boolean: status == 'LIVE' && availability == 'AVAILABLE' && !isDeleted && ownerActive
  isDeleted: boolean; // Soft-delete flag
  deletedAt?: FirebaseFirestore.Timestamp;
  deletedBy?: string;
  hasPendingChange: boolean;
  pendingChangeId?: string;
  lastDecisionReason?: string;
  approvedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  version: number;
}
```

### 7.4 `propertyPrivate/{propertyId}` (Restricted to Admin & Property Owner)
```typescript
interface PropertyPrivateDocument {
  propertyId: string;
  exactAddress: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  ownershipDetails: string;
  documentReferences: Array<{
    id: string;
    name: string;
    type: 'C_OF_O' | 'DEED_OF_ASSIGNMENT' | 'SURVEY_PLAN' | 'EXCISION' | 'OTHER';
    storagePath: string;
  }>;
  internalAdminNotes?: string; // Admin-only notes
}
```

### 7.5 `changeRequests/{requestId}`
```typescript
interface ChangeRequestDocument {
  id: string;
  type: 'ACCOUNT_REGISTRATION' | 'PROFILE_EDIT' | 'PROPERTY_SUBMIT' | 'PROPERTY_EDIT' | 'PROPERTY_DELETE' | 'ROLE_CHANGE' | 'ACCOUNT_DELETION';
  targetType: 'USER' | 'DEVELOPER' | 'PROPERTY';
  targetId: string;
  requestedBy: string; // uid
  requesterRole: 'SELLER' | 'DEVELOPER' | 'BUYER';
  proposedData: Record<string, any>; // Whitelisted delta fields
  previousData: Record<string, any>; // Baseline snapshot
  baseVersion: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  decisionBy?: string; // Admin uid
  decisionAt?: FirebaseFirestore.Timestamp;
  decisionReason?: string; // Mandatory on REJECTED
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 7.6 `threads/{threadId}` & `messages/{messageId}`
```typescript
interface ThreadDocument {
  id: string;
  kind: 'ENQUIRY' | 'SUPPORT';
  userId: string; // Buyer, Seller, or Developer
  userRole: 'BUYER' | 'SELLER' | 'DEVELOPER';
  propertyId?: string; // Required for ENQUIRY
  propertyTitle?: string;
  status: 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  unreadForAdmin: boolean;
  unreadForUser: boolean;
  lastMessageAt: FirebaseFirestore.Timestamp;
  lastMessageSnippet: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

interface MessageDocument {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: 'BUYER' | 'SELLER' | 'DEVELOPER' | 'ADMIN';
  body: string;
  createdAt: FirebaseFirestore.Timestamp;
}
```

---

## 8. Nigerian Property Taxonomy

Categories and specialized fields tailored to Nigerian property transactions (`config/property-categories.ts`):

### 8.1 Flats & Apartments (`FLAT_APARTMENT`)
- `MINI_FLAT` (Room and Parlour self-contained)
- `SELF_CONTAIN` (Studio apartment)
- `STANDARD_APARTMENT` (2–4 bedroom standard block unit)
- `PENTHOUSE` (Luxury top-floor unit)

### 8.2 Houses (`HOUSE`)
- `DETACHED_DUPLEX` (Standalone 2-storey house)
- `SEMI_DETACHED_DUPLEX` (Twin-unit sharing one common wall)
- `TERRACED_DUPLEX` (Row housing with private entrance)
- `DETACHED_BUNGALOW` (Single-storey standalone)
- `SEMI_DETACHED_BUNGALOW`
- `TERRACED_BUNGALOW`
- `BLOCK_OF_FLATS` (Entire residential building of multiple units)

### 8.3 Land (`LAND`)
- `RESIDENTIAL_LAND`
- `COMMERCIAL_LAND`
- `INDUSTRIAL_LAND`
- `MIXED_USE_LAND`
- `FARM_LAND`
- *Land Special Specs:* Title status (`C_OF_O`, `GOVERNORS_CONSENT`, `GAZETTE`, `SURVEY_PLAN`, `DEED_OF_ASSIGNMENT`, `COURT_JUDGEMENT`), Dimensions (e.g. 60ft x 120ft), Topography (`DRY`, `WATERLOGGED`, `SANDFILLED`).

### 8.4 Commercial (`COMMERCIAL`)
- `OFFICE_SPACE`, `PLAZA_COMPLEX_MALL`, `WAREHOUSE`, `SHOP`, `HOTEL_GUEST_HOUSE`, `FILLING_STATION`, `SCHOOL`, `RESTAURANT_BAR`, `CHURCH`.

---

## 9. Security, Files, and Image Pipeline

### 9.1 Storage Folder Architecture
```
private/
  users/{uid}/kyc/                     # Passports, CAC incorporation documents
  properties/{propertyId}/documents/   # Land titles, surveyor plans (Admin only)
  properties/{propertyId}/images-raw/  # Uploaded originals (prior to sanitization)
  properties/{propertyId}/images-pending/ # Staged for review
public/
  properties/{propertyId}/images/      # Approved, EXIF-stripped, WebP images
  developers/{developerId}/branding/   # Logos & public banners
```

### 9.2 Image Sanitization & Privacy Shield
1. **EXIF Stripping:** Smartphone photos taken in Nigeria frequently embed exact GPS coordinates in EXIF metadata. During upload processing, all EXIF/metadata is stripped to protect the property's precise security perimeter.
2. **Web Optimization:** Images are converted to WebP with responsive breakpoints (Thumbnail: 400px, Card: 800px, Detail: 1600px).
3. **Approval-Gated Publishing:** When a property is drafted or pending review, images reside solely in `private/.../images-pending/`. Only when Admin approves the `PROPERTY_SUBMIT` or `PROPERTY_EDIT` request are the processed images moved to `public/.../images/`.
4. **Instant Retraction:** If an account is suspended or a property unpublished, public image assets are revoked or redirected to a private placeholder.

---

## 10. Communication Hub & Admin Concierge

```
[ Visitor / Buyer ] ──► Clicks "Inquire on Listing" ──► Enters Inspection Question
                                 │
                                 ▼
                     [ Realto Internal Hub ]
                                 │
         ┌───────────────────────┴────────────────────────┐
         │                                                │
         ▼                                                ▼
[ Thread Created in Admin Inbox ]            [ WhatsApp Concierge Prompt ]
- Admin notified in dashboard                - Click-to-chat link with prefilled:
- Auto-acknowledgement email sent to buyer     "Hello Realto, I am interested in
- Thread visible in Buyer Dashboard            inspecting RTL-00104 (5-Bed Duplex,
- Admin replies directly in app                Lekki Phase 1). My name is..."
```

### Inquiries & Support Rules:
1. **No Inter-User Messaging:** Sellers and developers cannot message buyers. Buyers cannot message sellers.
2. **Admin Single Hub:** All property inquiries are dispatched to Admin. Admin arranges physical verification, escrow discussions, and site inspections.
3. **Seller Support Channel:** Sellers and developers use `SUPPORT` threads to communicate with Admin regarding document verification, KYC, listing revisions, or payment settlements.
4. **WhatsApp Integration:** WhatsApp click-to-chat links are strictly pre-configured to the official Realto platform concierge number (digits only, international format `+234...`). The target property ID and title are encoded in the query parameters.

---

## 11. Complete API Surface

All mutations run through Next.js App Router Route Handlers (`/app/api/...`), protected by session verification, role assertions, and Zod schemas.

### 11.1 Authentication & Sessions
- `POST /api/auth/register` — Registers `BUYER`, `SELLER`, or `DEVELOPER`. Initial state for sellers/developers is `PENDING_APPROVAL`.
- `POST /api/auth/session` — Validates Firebase ID token and issues `httpOnly` secure session cookie.
- `POST /api/auth/logout` — Destroys session cookie and revokes auth tokens.
- `GET /api/me` — Fetches current user profile, account status, unread notification counts, and role.

### 11.2 Private Drafts & Property Submissions (Owner Workspace)
- `GET /api/properties/drafts` — Lists the authenticated owner's private drafts.
- `POST /api/properties/drafts` — Creates a new draft listing (`status = 'DRAFT'`).
- `GET /api/properties/drafts/:id` — Fetches a single draft for editing.
- `PUT /api/properties/drafts/:id` — Updates draft contents freely without Change Request.
- `DELETE /api/properties/drafts/:id` — Permanently removes an unsubmitted private draft.
- `POST /api/properties/drafts/:id/submit` — Validates required fields, moves status to `PENDING_REVIEW`, and creates `PROPERTY_SUBMIT` Change Request.

### 11.3 Live Property Management (Owner Workspace)
- `GET /api/properties/mine` — Fetches all owner listings grouped by status (Drafts, In Review, Live, Rejected).
- `POST /api/properties/:id/edit-request` — Submits a `PROPERTY_EDIT` Change Request for an active listing.
- `POST /api/properties/:id/delete-request` — Submits a `PROPERTY_DELETE` Change Request.
- `POST /api/properties/:id/mark-sold-request` — Requests listing availability change to `SOLD`.

### 11.4 Change Requests (Common)
- `GET /api/change-requests/mine` — Retrieves pending and historical requests created by the user.
- `POST /api/change-requests/:id/withdraw` — Withdraws a pending request before Admin decides it.

### 11.5 Admin Governance (`/api/admin/...`)
- `GET /api/admin/metrics` — Dashboard counts: Pending Accounts, Pending Submissions, Pending Edits, New Inquiries.
- `GET /api/admin/change-requests` — Filterable review queue (by type and status).
- `GET /api/admin/change-requests/:id` — Detailed view with before/after data diff and document viewer.
- `POST /api/admin/change-requests/:id/approve` — Executes transactional approval, updates live record, increments version, updates `isPublic`, writes audit log, notifies owner.
- `POST /api/admin/change-requests/:id/reject` — Rejects request with mandatory `decisionReason`, writes audit log, notifies owner.
- `POST /api/admin/users/:id/suspend` — Suspends user and immediately unpublishes all associated listings.
- `POST /api/admin/users/:id/reactivate` — Restores user and recalculates listing visibility.
- `POST /api/admin/properties/:id/direct-edit` — Admin direct intervention (recorded as auto-approved change request).
- `POST /api/admin/properties/:id/toggle-visibility` — Manual unpublish/republish override.

### 11.6 Inquiries & Support Threads
- `POST /api/enquiries` — Buyer submits an inquiry regarding a live property (creates `ENQUIRY` thread and alerts Admin).
- `POST /api/support-threads` — Seller or Developer starts a support thread with Admin.
- `GET /api/threads` — Lists active threads for the authenticated user or Admin.
- `GET /api/threads/:id/messages` — Retrieves conversation messages.
- `POST /api/threads/:id/messages` — Appends a new message to an existing thread.
- `POST /api/admin/threads/:id/close` — Admin closes a resolved thread.

### 11.7 Saved Properties (Cart)
- `GET /api/saved` — Retrieves user's saved properties with current live availability status.
- `POST /api/saved/:propertyId` — Adds property to user's saved list.
- `DELETE /api/saved/:propertyId` — Removes property from saved list.
- `POST /api/saved/merge` — Merges anonymous guest localStorage items into user account upon sign-in.

---

## 12. Transactional Approval Engine (The Atomic Core)

When Admin clicks **Approve** on a Change Request, the update executes inside a **single Firestore Transaction**:

```typescript
await db.runTransaction(async (transaction) => {
  const reqRef = db.collection('changeRequests').doc(requestId);
  const reqSnap = await transaction.get(reqRef);
  if (!reqSnap.exists || reqSnap.data().status !== 'PENDING') {
    throw new Error('Request already decided or invalid');
  }

  const change = reqSnap.data() as ChangeRequestDocument;
  const targetRef = db.collection('properties').doc(change.targetId);
  const targetSnap = await transaction.get(targetRef);

  // Apply proposed fields to the live listing
  transaction.update(targetRef, {
    ...change.proposedData,
    status: 'LIVE',
    hasPendingChange: false,
    pendingChangeId: FirebaseFirestore.FieldValue.delete(),
    approvedAt: FirebaseFirestore.FieldValue.serverTimestamp(),
    version: (targetSnap.data().version || 0) + 1,
    isPublic: true // Evaluated by visibility engine
  });

  // Mark Change Request as APPROVED
  transaction.update(reqRef, {
    status: 'APPROVED',
    decisionBy: adminUid,
    decisionAt: FirebaseFirestore.FieldValue.serverTimestamp(),
    updatedAt: FirebaseFirestore.FieldValue.serverTimestamp()
  });

  // Write immutable audit log entry
  const auditRef = db.collection('auditLogs').doc();
  transaction.set(auditRef, {
    actorId: adminUid,
    actorRole: 'ADMIN',
    action: `APPROVE_${change.type}`,
    entityType: change.targetType,
    entityId: change.targetId,
    requestId: change.id,
    timestamp: FirebaseFirestore.FieldValue.serverTimestamp()
  });

  // Write in-app notification to requester
  const notifRef = db.collection('notifications').doc();
  transaction.set(notifRef, {
    recipientId: change.requestedBy,
    title: 'Listing Approved!',
    message: 'Your property has been approved and is now live on the marketplace.',
    linkTo: `/property/${targetSnap.data().slug}`,
    read: false,
    createdAt: FirebaseFirestore.FieldValue.serverTimestamp()
  });
});
```

---

## 13. Visibility Computation Matrix (`recomputeVisibility`)

The boolean `properties.isPublic` governs whether a property appears in home feeds, search results, category pages, or Developer Spaces. It is recomputed whenever any parent state changes:

$$\text{isPublic} = (\text{owner.accountStatus} == \text{'ACTIVE'}) \land (\text{property.status} == \text{'LIVE'}) \land (\text{property.availability} == \text{'AVAILABLE'}) \land (\neg \text{property.isDeleted})$$

| Owner Status | Property Status | Availability | `isDeleted` | Computed `isPublic` | Resulting Visitor Visibility |
|---|---|---|---|---|---|
| `ACTIVE` | `LIVE` | `AVAILABLE` | `false` | **`true`** | **Visible in Public Feeds & Developer Space** |
| `PENDING_APPROVAL` | `PENDING_REVIEW` | `AVAILABLE` | `false` | `false` | Hidden (In Admin Review Queue) |
| `PENDING_APPROVAL` | `DRAFT` | `AVAILABLE` | `false` | `false` | Hidden (Owner's Private Workspace) |
| `ACTIVE` | `LIVE` | `SOLD` | `false` | `false` | Hidden from public search |
| `SUSPENDED` | `LIVE` | `AVAILABLE` | `false` | `false` | Immediately hidden platform-wide |
| `ACTIVE` | `UNPUBLISHED`| `AVAILABLE` | `false` | `false` | Hidden (Admin direct unpublish) |
| `ACTIVE` | `LIVE` | `AVAILABLE` | `true` | `false` | Hidden (Soft deleted) |

---

## 14. Implementation & Verification Roadmap

### Phase 1: Core Foundation & Shared Config
- Set up TypeScript configurations, role constants (`config/roles.ts`), categories (`config/property-categories.ts`), and Zod schemas (`lib/validation/*`).
- Configure Firebase Admin SDK singleton with service account credentials.

### Phase 2: Authentication & Onboarding
- Registration endpoint supporting `BUYER`, `SELLER`, and `DEVELOPER`.
- Enforce `PENDING_APPROVAL` account status for sellers/developers.
- Provide immediate dashboard access for `PENDING_APPROVAL` users with review banners and document upload forms.

### Phase 3: Private Drafts & Change Request Engine
- Implement private draft store (`GET /api/properties/drafts`, `POST`, `PUT`, `DELETE`).
- Implement draft submit action generating `PROPERTY_SUBMIT` change request.
- Build Admin Review Queue with side-by-side diff viewers and atomic approval/rejection handling.

### Phase 4: Public Marketplace & Developer Spaces
- Build Home Page index rendering individual cards across all live properties.
- Build Developer Space route (`/developer/[slug]`) triggered for developers with $>1$ live properties.
- Ensure strict sanitization (zero contact numbers, zero direct email addresses, zero personal data).

### Phase 5: Admin Inquiries Hub & Realto Concierge
- Implement Buyer inquiry modal routing directly to Admin threads.
- Implement pre-filled WhatsApp concierge click-to-chat integration.
- Implement Seller/Developer support threads.

---

## 15. Summary of Key Differences from Earlier Drafts

1. **Developer Spaces:** Added dedicated showcase pages for developers with $>1$ live listings, while keeping the home page an individual aggregated mix.
2. **Contact Privacy Shield:** Strictly banned all seller/developer direct contact info from public view. All inquiries go through Admin and the Realto Concierge.
3. **Pending Account Operation:** Sellers and developers can access their dashboards immediately upon sign-up, create drafts, explore features, and submit listings without waiting on account approval (listings simply do not go live until approved).
4. **Draft vs. Live Separation:** Drafts are private and editable without Change Requests. Live listings require audited Change Requests for any change.
5. **Streamlined Admin:** Focused on a unified `ADMIN` role for this build round, deferring Super Admin delegation.
