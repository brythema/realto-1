# Realto Architectural & Product Decisions Record (ADR)

This file tracks the architecture, schema, security, and product decisions governing the Realto platform.

---

## Decision 001: Developer Spaces vs. Unified Index

- **Context:** Developers often list multiple estate units or housing projects. Visitors want to explore all offerings from a particular developer, yet the home page must remain a rich, democratic mix of all available Nigerian real estate listings.
- **Decision:**
  1. The Home / Index page (`/`) presents an aggregated, individual-card feed of all approved, live listings across all sellers and developers.
  2. If a developer has **more than one approved live property**, they automatically receive a dedicated public **Developer Space** (`/developer/[developerSlug]`).
  3. The Developer Space showcases the developer's verified business name, brand logo, project portfolio, and all their active live listings in one curated view.
  4. Individual properties belonging to multi-listing developers feature a subtle link: *"Explore more properties from this developer"*.

---

## Decision 002: Strict Contact Information Privacy (Admin-as-Single-Hub)

- **Context:** Marketplace disintermediation and consumer fraud are prominent risks in Nigerian real estate. Direct seller or developer contacts can lead to unverified off-platform transactions, bait-and-switch deals, and lack of accountability.
- **Decision:**
  1. No seller or developer phone numbers, personal email addresses, WhatsApp links, or exact residential addresses are ever rendered on public pages or returned in public API responses/DTOs.
  2. On Developer Spaces, only non-contact brand assets are displayed: Company Name, Logo, About/Overview text, and verified accreditation badges. Contact buttons are strictly omitted.
  3. Every inquiry, question, and inspection request from visitors or buyers routes exclusively to **Realto Platform Administration** through the internal messaging thread system and the official Realto WhatsApp concierge.
  4. Realto Admin inspects, verifies, and facilitates inquiries directly.

---

## Decision 003: Immediate Dashboard Access for `PENDING_APPROVAL` Accounts

- **Context:** Forcing sellers and developers to wait on a blank screen after registration creates friction and discourages onboarding.
- **Decision:**
  1. When a Seller or Developer registers, their user record and profile are created immediately with `accountStatus = "PENDING_APPROVAL"`.
  2. The user is granted immediate access to their dedicated dashboard.
  3. The dashboard clearly presents a persistent banner indicating pending review status, allows uploading verification documents (KYC / CAC), viewing incoming platform notifications, submitting support threads to Admin, and creating property drafts.
  4. Crucial rule: **Nothing created or submitted by a `PENDING_APPROVAL` user goes live to the public.** Any property submitted enters the Admin review queue as a `PROPERTY_SUBMIT` Change Request and can only be made live once both the account and listing are approved by Admin.

---

## Decision 004: Private Draft Data vs. Live Data Isolation

- **Context:** Property listings contain numerous specs, pricing details, and image uploads. Sellers and developers need freedom to assemble listings progressively without triggering premature admin review or impacting public search indexes.
- **Decision:**
  1. **PRIVATE DRAFT DATA:**
     - Sellers and developers can create, edit, save, reorder photos, and delete draft listings freely in their private workspace (`status = "DRAFT"`).
     - Drafts are stored in private state and are completely excluded from public search queries (`isPublic = false`).
     - Edits to drafts do not create Change Requests and do not notify Admin.
  2. **SUBMISSION STEP:**
     - Submitting a draft creates a formal `PROPERTY_SUBMIT` Change Request and locks the draft into `status = "PENDING_REVIEW"`.
  3. **LIVE DATA:**
     - Once Admin approves the submission, the listing transitions to `status = "LIVE"` and `isPublic = true`.
     - From this point forward, the owner cannot modify the live record directly.
     - Any owner-initiated modification creates a `PROPERTY_EDIT` Change Request.
     - While an edit is pending approval, the live public marketplace continues to display the previously approved data.
     - Any deletion request creates a `PROPERTY_DELETE` Change Request. Upon Admin approval, the listing is soft-deleted (`isDeleted = true`, `isPublic = false`).

---

## Decision 005: Scope Streamlining — Single `ADMIN` Role for Current Build

- **Context:** To ensure rapid delivery, zero operational overhead, and robust implementation of core marketplace, draft, and change-request mechanisms, multi-tiered Super Admin delegation is deferred.
- **Decision:**
  1. For this build cycle, platform administrative capabilities are consolidated into the `ADMIN` role.
  2. `SUPER_ADMIN` separate role logic, invitation flows, and `/super-admin` route hierarchies are removed from the active path.
  3. The `ADMIN` role holds full governance authority: approving/rejecting change requests with mandatory written reasons, suspending/reinstating accounts, managing property visibility, responding to buyer inquiries, replying to seller support threads, and auditing system events.
