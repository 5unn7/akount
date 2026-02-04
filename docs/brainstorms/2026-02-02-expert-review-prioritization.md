# Expert Review Prioritization Brainstorm

**Date:** 2026-02-02
**Status:** Brainstormed
**Related:** akount-review.md (Expert Panel Review)

---

## Problem Statement

An expert review document was generated covering product strategy, architecture, database design, frontend, DevOps, security, AI, and testing. We need to determine what's:
1. Already implemented (review may be outdated)
2. Truly critical for MVP
3. Nice-to-have for later
4. Over-engineering to skip entirely

---

## Current State Summary

**Phase 0 is 100% complete:**
- Authentication (Clerk + Passkeys)
- Database (PostgreSQL + Prisma, 40+ models, migrations, seed data)
- API Foundation (Fastify + JWT auth + Zod validation + Tenant middleware)
- Bank Statement Import (PDF parsing, account matching, AI categorization)
- Performance optimized (50x query reduction, tenant middleware)

**The review was based on an earlier snapshot** and several recommendations are already addressed.

---

## Prioritization Decisions

### IMPLEMENT NOW (Phase 1 Blockers)

| Item | Effort | Rationale |
|------|--------|-----------|
| **Soft deletes (deletedAt)** | 2h | Financial data must NEVER be hard deleted |
| **Add missing indexes** | 1h | Performance for scale |
| **CI/CD Pipeline** | 2h | Lint, typecheck, test on every PR |
| **Rate limiting** | 30m | Security baseline (@fastify/rate-limit) |
| **Security headers** | 30m | Helmet plugin for CSP, HSTS |
| **Basic test infrastructure** | 2h | Vitest setup + first tests |
| **Verify Railway backups** | 15m | Confirm enabled, document restore |

**Total: ~8 hours**

---

### IMPLEMENT LATER (Phase 2-5)

| Item | Phase | Rationale |
|------|-------|-----------|
| **TaxLine model (GST/HST breakdown)** | Phase 4 | Needed for invoicing with Canadian tax |
| **Double-entry validation (DB trigger)** | Phase 3 | Need transaction service first |
| **Flinks integration testing** | Phase 2 | Have PDF import; Flinks is enhancement |
| **AI confidence threshold** | Phase 2 | Flag low-confidence for manual review |
| **Integration tests** | Phase 1+ | After unit test foundation |
| **E2E tests (Playwright)** | Phase 3 | After core features stable |
| **User flow documentation** | Phase 1 | Onboarding, reconciliation, month-end |
| **WCAG accessibility review** | Phase 1 | Aria labels, focus management |
| **PIPEDA compliance features** | Phase 5 | Data export, deletion |

---

### SKIP FOR V1 (Over-engineering)

| Item | Rationale |
|------|-----------|
| **ADRs (Architecture Decision Records)** | Solo dev, docs sufficient |
| **System diagrams** | Can draw later if needed |
| **OpenAPI contract-first** | Zod schemas are sufficient |
| **Keyboard shortcuts** | Power user feature, not MVP |
| **Dockerfile for API** | Vercel/Railway handle deployment |
| **Zustand state management** | Server Components first |
| **Decimal(19,4) for money** | Int cents is working, simpler, correct |

---

### ALREADY DONE (Review Outdated)

| Recommendation | Our Implementation |
|----------------|-------------------|
| Multi-tenant middleware | `apps/api/src/middleware/tenant.ts` |
| Fastify scaffolding | 28 TypeScript files, full structure |
| Input validation | Zod schemas on all routes |
| Auth middleware | Clerk JWT verification |
| FX rate handling | FXRate model + batch fetching |
| Design system | `docs/design-system/` complete |
| Database migrations | Applied and seeded |
| AI categorization | Perplexity integration |

---

## Schema Improvements Required

### Add Soft Deletes (Priority: NOW)

Models needing `deletedAt` field:
```prisma
// All financial data models:
Transaction
JournalEntry
Invoice
Bill
Payment
Account
// User-facing data:
Client
Vendor
Category
// Audit-critical:
BankFeedTransaction
```

### Add Missing Indexes (Priority: NOW)

```prisma
model Category {
  // Add tenantId index (currently missing!)
  @@index([tenantId])
  @@index([tenantId, type])
}

model Transaction {
  // Add composite for unreconciled queries
  @@index([accountId, journalEntryId])  // Find unposted transactions
}

model Invoice {
  // Already good
}
```

### Keep Int for Money (Decision: CONFIRMED)

**Rationale:**
- Simpler math (no Decimal library)
- No precision errors possible
- Standard for modern fintech (Stripe, Square)
- 99% of our use cases don't need sub-cent precision
- Can add precision field later if crypto/FX needs it

---

## Competitive Analysis (Defer)

Not blocking code. Note for marketing phase:

| Competitor | Weakness vs Akount |
|------------|-------------------|
| Wave | US-centric, no multi-entity |
| QuickBooks | Expensive, complex, charges for multi-entity |
| FreshBooks | No multi-currency native |
| Xero | Good but expensive for solopreneurs |

**Akount Positioning:** Multi-entity native, AI-powered, Canadian-first, modern UX

---

## Open Questions

- [ ] Is Railway database backup actually enabled? (Verify)
- [ ] Which test framework? (Vitest recommended for Vite compat)
- [ ] Minimum test coverage target? (Suggest: 60% for services)

---

## Next Steps

1. **Create implementation plan** for NOW items
2. **Run /processes:plan** with scope: soft deletes, indexes, CI/CD, security, tests
3. **Execute Phase 1 priorities** (dashboard integration) in parallel

---

## Decision Summary

| Category | Count | Estimated Hours |
|----------|-------|-----------------|
| Implement NOW | 7 items | ~8 hours |
| Implement Later | 9 items | Phase 2-5 |
| Skip for V1 | 7 items | 0 hours |
| Already Done | 8 items | N/A |

**Net result:** Review helpful for identifying gaps, but majority is already addressed or deferred appropriately.
