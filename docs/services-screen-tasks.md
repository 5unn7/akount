# Services Screen — Parity Audit Tasks

**Audit Date:** 2026-02-19
**Source:** `audit:fe-be-parity`
**To merge into:** TASKS.md

---

## Audit Summary

- **Frontend:** 3 stub pages (Accountant, Bookkeeping, Documents) — all "Coming Soon"
- **Backend:** 6 endpoints, all 501 stubs. Zero service files.
- **Prisma Models:** None for services domain
- **Design Spec:** `docs/design-system/04-workflows/accountant-collaboration.md` (268 lines, detailed)
- **Roles Ready:** ACCOUNTANT, BOOKKEEPER, ADVISOR, INVESTOR already in TenantUserRole enum
- **Permissions:** Services domain NOT yet in PERMISSION_MATRIX

**Vision:** QuickBooks ProAdvisor-style marketplace. Accountants/bookkeepers sign up as professionals, solopreneurs browse and hire them. Start with base model so when professionals sign up, they appear on this screen.

---

## High Priority (10 tasks) — Foundation: Models, CRUD, Invite Flow

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-129 | Services: Add Prisma models — ServiceProvider (profile, credentials, specializations, hourly rate, availability, verified status), ServiceInvitation (email, role, entityIds, expiry, status), ServiceEngagement (active collaboration relationship) | 4-6h | High | backlog | | audit:fe-be-parity |
| DEV-130 | Services: Add services domain to PERMISSION_MATRIX — define VIEW/ACT/APPROVE/ADMIN for accountant, documents, tax resources | 1h | High | backlog | | audit:fe-be-parity |
| DEV-131 | Services: Build ServiceProvider service — CRUD for professional profiles (create on signup, update profile, list, search) | 3-4h | High | backlog | [needs: DEV-129] | audit:fe-be-parity |
| DEV-132 | Services: Build invitation service — invite accountant/bookkeeper by email, accept/reject/expire flow, create TenantUser on accept | 4-6h | High | backlog | [needs: DEV-129] | audit:fe-be-parity |
| DEV-133 | Services: Implement all 6 stub endpoints — wire invitation CRUD, document request, tax filing stubs to real services | 3-4h | High | backlog | [needs: DEV-131, DEV-132] | audit:fe-be-parity |
| UX-89 | Services: Build services landing page at `/services` — "Find a Professional" hero, category cards (Accountant, Bookkeeper, Tax Advisor), featured providers | 3-4h | High | backlog | [needs: DEV-131] | audit:fe-be-parity |
| UX-90 | Services: Build accountant page — browse/search professional accountants with filters (specialization, rate, availability, verified) | 3-4h | High | backlog | [needs: DEV-131] | audit:fe-be-parity |
| UX-91 | Services: Build bookkeeping page — browse/search bookkeepers with filters | 3-4h | High | backlog | [needs: DEV-131] | audit:fe-be-parity |
| UX-92 | Services: Add invite professional flow — email invite form, pending invitations list, accept/reject status tracking | 2-3h | High | backlog | [needs: DEV-132] | audit:fe-be-parity |
| UX-93 | Services: Add professional profile card component — photo, name, credentials, specializations, rate, availability badge, "Hire" button | 2-3h | High | backlog | [needs: DEV-131] | audit:fe-be-parity |

## Medium Priority (16 tasks) — Marketplace + Collaboration

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-134 | Services: Add professional signup flow — accountant/bookkeeper registers, creates ServiceProvider profile, selects specializations | 4-6h | Medium | backlog | [needs: DEV-129] | audit:fe-be-parity |
| DEV-135 | Services: Add professional verification system — credential upload, manual/auto verification, "Verified" badge | 3-4h | Medium | backlog | [needs: DEV-131] | audit:fe-be-parity |
| DEV-136 | Services: Add ServiceEngagement service — start/end engagement, track active collaborations, entity-scoped access control | 3-4h | Medium | backlog | [needs: DEV-129] | audit:fe-be-parity |
| UX-94 | Services: Add professional detail page — full profile, reviews, engagement history, "Request Service" button | 3-4h | Medium | backlog | [needs: UX-93] | audit:fe-be-parity |
| UX-95 | Services: Add active engagements dashboard — list of hired professionals with status, entity access, start date, actions (revoke, extend) | 2-3h | Medium | backlog | [needs: DEV-136] | audit:fe-be-parity |
| DEV-137 | Services: Add review/rating system — clients rate professionals after engagement (1-5 stars + text review) | 3-4h | Medium | backlog | [needs: DEV-136] | audit:fe-be-parity |
| UX-96 | Services: Add review submission form + display reviews on professional profile | 2-3h | Medium | backlog | [needs: DEV-137] | audit:fe-be-parity |
| DEV-138 | Services: Build documents page — file storage per engagement, upload/download, OCR receipt scanning, auto-attach to transactions | 4-6h | Medium | backlog | [needs: DEV-136] | audit:fe-be-parity |
| UX-97 | Services: Build documents UI — file list, drag-and-drop upload, preview, share with professional | 3-4h | Medium | backlog | [needs: DEV-138] | audit:fe-be-parity |
| DEV-139 | Services: Add document request workflow — professional requests specific docs from client, client uploads, status tracking | 2-3h | Medium | backlog | [needs: DEV-138] | audit:fe-be-parity |
| UX-98 | Services: Add document request inbox — pending requests from professionals with upload action | 2-3h | Medium | backlog | [needs: DEV-139] | audit:fe-be-parity |
| DEV-140 | Services: Add entity-scoped access for professionals — grant per-entity permissions (view transactions, post entries, reconcile) | 3-4h | Medium | backlog | [needs: DEV-136] | audit:fe-be-parity |
| UX-99 | Services: Add access management UI — toggle which entities and features each professional can access | 2-3h | Medium | backlog | [needs: DEV-140] | audit:fe-be-parity |
| DEV-141 | Services: Add professional availability calendar — set available hours, booking slots, timezone handling | 3-4h | Medium | backlog | [needs: DEV-131] | audit:fe-be-parity |
| DEV-142 | Services: Add in-app messaging between client and professional (simple thread per engagement) | 4-6h | Medium | backlog | [needs: DEV-136] | audit:fe-be-parity |
| UX-100 | Services: Add messaging UI — conversation thread per engagement, file attachments, notification badge | 3-4h | Medium | backlog | [needs: DEV-142] | audit:fe-be-parity |

## Low Priority (9 tasks) — Tax, Approval Workflows, Analytics

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-143 | Services: Add TaxFiling + TaxDeadline models — jurisdiction-specific deadlines, filing status, preparer tracking | 3-4h | Low | backlog | [needs: DEV-129] | audit:fe-be-parity |
| DEV-144 | Services: Implement tax filing endpoints — list filings, view deadlines by jurisdiction (CA, US, etc.) | 2-3h | Low | backlog | [needs: DEV-143] | audit:fe-be-parity |
| UX-101 | Services: Build tax calendar page — upcoming deadlines, filing status, jurisdiction filter | 3-4h | Low | backlog | [needs: DEV-144] | audit:fe-be-parity |
| DEV-145 | Services: Add approval workflow — Bookkeeper → Accountant → Owner chain for journal entries and period close | 4-6h | Low | backlog | [needs: DEV-136] | audit:fe-be-parity |
| UX-102 | Services: Add approval queue UI — pending items requiring approval, approve/reject/comment | 3-4h | Low | backlog | [needs: DEV-145] | audit:fe-be-parity |
| DEV-146 | Services: Add professional analytics dashboard — engagement count, revenue, avg rating, response time for professionals | 3-4h | Low | backlog | [needs: DEV-137] | audit:fe-be-parity |
| UX-103 | Services: Add professional dashboard — earnings summary, active clients, pending requests, calendar (for logged-in professionals) | 3-4h | Low | backlog | [needs: DEV-146] | audit:fe-be-parity |
| DEV-147 | Services: Add professional search SEO — public profiles for verified professionals (guest-accessible, no auth required) | 2-3h | Low | backlog | [needs: DEV-135] | audit:fe-be-parity |
| DEV-148 | Services: Add notification system for services — new invitation, document request, message received, review posted | 3-4h | Low | backlog | [needs: DEV-142] | audit:fe-be-parity |

---

## Totals

| Priority | Count |
|----------|-------|
| High | 10 |
| Medium | 16 |
| Low | 9 |
| **Total** | **35** |

## ID Ranges Used

- UX-89 through UX-103 (15 tasks)
- DEV-129 through DEV-148 (20 tasks)

## Merge Instructions

When merging into TASKS.md:
1. Verify highest existing IDs (currently DEV-128, UX-88 from system-screen-tasks.md)
2. Add High tasks to "Critical / High" section
3. Add Medium + Low tasks to "Medium / Low" section
4. Update header counts: +35 total, +10 high, +16 medium, +9 low, +0 ready, +35 backlog
