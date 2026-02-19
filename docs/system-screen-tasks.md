# System Screen — Parity Audit Tasks

**Audit Date:** 2026-02-19
**Source:** `audit:fe-be-parity`
**To merge into:** TASKS.md

---

## Audit Summary

- **Frontend:** 7 pages, 1 built (Settings/Data Export), 6 stubs
- **Backend:** 17 endpoints, 13 implemented, 2 stubbed (user invite, update settings)
- **Services:** 7 (EntityService, UserService, AuditQueryService, HealthService, DataExportService, Auth/Tenant middleware, Audit utility)
- **Models:** Tenant, TenantUser, User, Entity, OnboardingProgress, AuditLog, DomainEvent, AccountingPolicy

---

## High Priority (12 tasks) — Wire existing backend to frontend + setup health

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| UX-66 | System: Build entities page — list entities with type/currency/account counts, create entity form (full CRUD backend exists) | 3-4h | High | backlog | | audit:fe-be-parity |
| UX-67 | System: Build users page — list tenant users with role/email/joined date (GET endpoint exists) | 2-3h | High | backlog | | audit:fe-be-parity |
| DEV-112 | System: Implement user invite endpoint + email flow (POST /users/invite is 501 stub) | 3-4h | High | backlog | | audit:fe-be-parity |
| UX-68 | System: Add user invite modal — email + role selector, send invitation (needs DEV-112) | 2-3h | High | backlog | [needs: DEV-112] | audit:fe-be-parity |
| UX-69 | System: Build audit log viewer — filterable table with model/action/user/date filters (rich backend query API exists) | 3-4h | High | backlog | | audit:fe-be-parity |
| DEV-113 | System: Implement PUT /settings endpoint — update tenant name, region, preferences (currently 501 stub) | 2-3h | High | backlog | | audit:fe-be-parity |
| UX-70 | System: Build full settings page — tenant name, region, plan display, preferences form (needs DEV-113) | 2-3h | High | backlog | [needs: DEV-113] | audit:fe-be-parity |
| UX-71 | System: Build security page — active sessions list, password change (via Clerk), login history | 2-3h | High | backlog | | audit:fe-be-parity |
| UX-72 | System: Add entity edit form — update name, fiscal year, tax ID, address (EntityService.updateEntity exists, needs PUT route) | 2-3h | High | backlog | | audit:fe-be-parity |
| DEV-114 | System: Add PUT /entities/:id route — wire EntityService.updateEntity to API (service exists, no route) | 1h | High | backlog | | audit:fe-be-parity |
| UX-73 | System: Add system landing page at `/system` with admin summary cards (entity count, user count, recent audit activity, export status) | 2-3h | High | backlog | | audit:fe-be-parity |
| UX-83 | System: Add setup completeness score card — checklist (entity details, COA seeded, bank connected, fiscal year set, first import) with % progress bar | 2-3h | High | backlog | | audit:fe-be-parity |

## Medium Priority (21 tasks) — Extend with useful features + UX polish

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| UX-74 | System: Add audit log record detail view — click row to see before/after diff with JSON highlighting | 2-3h | Medium | backlog | [needs: UX-69] | audit:fe-be-parity |
| UX-75 | System: Add audit log export (CSV/PDF) for compliance reporting | 2-3h | Medium | backlog | [needs: UX-69] | audit:fe-be-parity |
| DEV-115 | System: Add entity delete/archive — soft deactivation with confirmation (prevent deleting entity with active data) | 2-3h | Medium | backlog | | audit:fe-be-parity |
| DEV-116 | System: Add user role change endpoint — OWNER can promote/demote users (ADMIN, ACCOUNTANT, VIEWER) | 2-3h | Medium | backlog | | audit:fe-be-parity |
| UX-76 | System: Add user role management UI — change role dropdown on user list (needs DEV-116) | 1-2h | Medium | backlog | [needs: DEV-116] | audit:fe-be-parity |
| DEV-117 | System: Add user removal endpoint — remove user from tenant (revoke TenantUser membership) | 1-2h | Medium | backlog | | audit:fe-be-parity |
| UX-77 | System: Add remove user button with confirmation dialog (needs DEV-117) | 1h | Medium | backlog | [needs: DEV-117] | audit:fe-be-parity |
| DEV-118 | System: Add data import capability — restore from backup ZIP (inverse of data-export) | 4-6h | Medium | backlog | | audit:fe-be-parity |
| UX-78 | System: Build integrations page — connection cards for Plaid/MX, Stripe, PayPal with connect/disconnect | 3-4h | Medium | backlog | [needs: INFRA-13] | audit:fe-be-parity |
| UX-79 | System: Build rules page — automation rules list, create/edit rule form (Rule model exists in AI domain) | 3-4h | Medium | backlog | | audit:fe-be-parity |
| DEV-119 | System: Add notification preferences — email/in-app toggle per event type (invoice overdue, budget alert, etc.) | 3-4h | Medium | backlog | | audit:fe-be-parity |
| UX-80 | System: Add 2FA toggle on security page (Clerk supports TOTP/SMS, just needs UI wiring) | 2-3h | Medium | backlog | [needs: UX-71] | audit:fe-be-parity |
| DEV-120 | System: Add tenant billing/subscription management — plan display, upgrade flow, usage meters | 3-4h | Medium | backlog | | audit:fe-be-parity |
| UX-81 | System: Add data export history — list past exports with date/size/entity, re-download link | 2-3h | Medium | backlog | | audit:fe-be-parity |
| DEV-122 | System: Add webhook configuration — register URLs for event callbacks (invoice.created, payment.received, etc.) for Zapier/Make.com integration | 4-6h | Medium | backlog | | audit:fe-be-parity |
| UX-84 | System: Add data quality indicators card — uncategorized txn count, unreconciled accounts, draft JE count, stale imports warning | 2-3h | Medium | backlog | | audit:fe-be-parity |
| UX-85 | System: Add usage stats card — this month's transaction/invoice/report/export counts with trend vs last month | 2-3h | Medium | backlog | | audit:fe-be-parity |
| DEV-127 | System: Add danger zone section — delete entity (with safeguards), clear test data, cancel subscription with confirmation flows | 2-3h | Medium | backlog | | audit:fe-be-parity |
| UX-86 | System: Add last backup indicator on settings page + one-click re-export button | 1h | Medium | backlog | | audit:fe-be-parity |
| DEV-128 | System: Add "Load Sample Data" button for new users — pre-populated company with invoices, bills, transactions to explore Akount | 3-4h | Medium | backlog | | audit:fe-be-parity |
| UX-87 | System: Add compliance/audit readiness checklist — balanced entries, closed periods, no orphan txns, soft delete intact, % score | 3-4h | Medium | backlog | | audit:fe-be-parity |

## Low Priority (6 tasks) — Future enhancements

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| DEV-121 | System: Add API key management — generate/revoke API keys for programmatic access | 3-4h | Low | backlog | | audit:fe-be-parity |
| DEV-123 | System: Add custom invoice logo + PDF header branding (upload logo, set company header for invoice/bill PDFs) | 3-4h | Low | backlog | | audit:fe-be-parity |
| DEV-124 | System: Add accounting policy management UI — rounding method, amortization, FX policy (AccountingPolicy model exists) | 2-3h | Low | backlog | | audit:fe-be-parity |
| DEV-125 | System: Add scheduled data export — automatic weekly/monthly backup to email or cloud storage | 3-4h | Low | backlog | | audit:fe-be-parity |
| DEV-126 | System: Add activity dashboard widget — daily/weekly summary of system changes (uses AuditQueryService.getDailySummary) | 2-3h | Low | backlog | | audit:fe-be-parity |
| UX-88 | System: Add entity switcher cards — visual per-entity cards with key stats (accounts, last txn date, currency, setup status) | 2-3h | Low | backlog | | audit:fe-be-parity |

---

## Totals

| Priority | Count |
|----------|-------|
| High | 12 |
| Medium | 21 |
| Low | 6 |
| **Total** | **39** |

## Changes from v1

- **Added 8 tasks:** UX-83 (setup score), UX-84 (data quality), UX-85 (usage stats), DEV-127 (danger zone), UX-86 (backup indicator), DEV-128 (sample data), UX-87 (compliance checklist), UX-88 (entity switcher)
- **Removed:** UX-82 (keyboard shortcuts settings — duplicate of existing UX-6/UX-7)
- **Moved:** DEV-122 (webhooks) from Low → Medium (critical for Zapier/Make.com integration)
- **Renamed:** DEV-123 from "tenant branding" → "custom invoice logo + PDF header branding" (more specific)

## ID Ranges Used

- UX-66 through UX-88 (22 tasks, UX-82 skipped)
- DEV-112 through DEV-128 (16 tasks, DEV-122 kept but moved priority)

## Merge Instructions

When merging into TASKS.md:
1. Verify highest existing IDs haven't changed (currently DEV-111, UX-65)
2. Add High tasks to "Critical / High" section
3. Add Medium + Low tasks to "Medium / Low" section
4. Update header counts: +39 total, +12 high, +21 medium, +6 low, +0 ready, +39 backlog
