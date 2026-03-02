# Prisma Migration Review: AIConsent Model (SEC-32)

**Reviewer:** prisma-migration-reviewer
**Date:** 2026-02-27
**Migration:** `20260227160951_add_ai_consent_model`
**Risk Level:** MEDIUM
**Breaking Changes:** None
**Data Loss Risk:** None

---

## Migration Safety Assessment

This migration adds a new AIConsent table for AI automation consent management (GDPR Article 22, PIPEDA 4.3). The migration is safe to apply with **one critical issue** that must be fixed before production deployment.

**Overall Status:** ⚠️ **CHANGES REQUIRED** (1 critical issue)

---

## Findings

### ⚠️ P0 (CRITICAL): CASCADE Delete on User Relation Violates Financial Audit Trail

**File:** `schema.prisma:93`, `migration.sql:31`
**Issue:** AIConsent uses `onDelete: Cascade` on the User relation. When a User is deleted, all their AIConsent records are immediately deleted, **destroying the audit trail of consent decisions**.

```prisma
// ❌ DANGEROUS - Line 93
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Why This Violates Compliance:**

1. **GDPR Article 30** requires maintaining records of processing activities, including consent. Deleting consent records when a user is deleted makes it impossible to prove compliance during audits.
2. **PIPEDA 4.9** (Retention) requires organizations to retain personal information only as long as necessary. The consent record itself is the **proof** of lawful processing duration — deleting it eliminates the evidence.
3. **AI Act (EU)** Article 61 requires maintaining logs of high-risk AI systems for regulatory inspection. Consent decisions ARE part of that log.
4. **Right to erasure (GDPR Article 17)** does NOT require deleting metadata about consent — it requires deleting the personal data that was processed under that consent. The consent record itself is minimal (user ID + tenant ID + boolean flags + timestamps) and is legally justified to retain for accountability.

**Real-World Scenario:**
```
1. User registers, consents to auto-categorize (Jan 2025)
2. System categorizes 1000 transactions over 6 months
3. User exercises GDPR "right to be forgotten" (July 2025)
4. User record deleted → AIConsent CASCADE deleted
5. Regulator audits in Aug 2025: "Prove user consented to auto-categorize"
6. → NO RECORD. Compliance violation. Potential fine: 4% of global revenue.
```

**Fix:**

**Option 1: Change to Restrict (RECOMMENDED)**
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Restrict)
```
This prevents User deletion unless AIConsent is manually handled first. Forces explicit consent archival workflow.

**Option 2: Soft Delete Pattern (More Complex)**
Add `deletedAt DateTime?` to AIConsent and modify User deletion to soft-delete consent records instead of CASCADE. Requires service-layer logic.

**Option 3: Archive to Separate Table**
Move AIConsent to an `AIConsentArchive` table during User deletion, preserving audit trail. Most compliant but adds complexity.

**Migration SQL Fix (for Option 1):**
```sql
-- Line 31 - Change ON DELETE CASCADE to ON DELETE RESTRICT
ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_userId_fkey";
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### ⚠️ P0 (CRITICAL): CASCADE Delete on Tenant Relation Also Problematic

**File:** `schema.prisma:94`, `migration.sql:34`
**Issue:** Similar to the User relation, `onDelete: Cascade` on Tenant means deleting a tenant (e.g., account closure) destroys all consent records.

```prisma
// ❌ DANGEROUS - Line 94
tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
```

**Why This Matters:**

- Tenant deletion often happens during offboarding or trial cleanup.
- GDPR requires retaining proof of lawful processing even after business relationship ends.
- Deleting consent records makes it impossible to defend against post-deletion claims.

**Fix:**
```prisma
tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Restrict)
```

**Migration SQL Fix:**
```sql
ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_tenantId_fkey";
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### ✅ P1 (GOOD): Granular Consent Toggles Follow Data Minimization

**File:** `schema.prisma:84-88`
**Issue:** None — this is **correct design**.

The model provides 5 separate boolean toggles instead of a single "AI consent" flag:
- autoCreateBills
- autoCreateInvoices
- autoMatchTransactions
- autoCategorize
- useCorrectionsForLearning

**Why This is Good:**

- **GDPR Article 5(1)(c)** - Data minimization: Users consent only to what they actually use.
- **GDPR Recital 32** - Consent must be specific, not bundled. This allows users to say "yes to categorization, no to auto-create bills".
- **PIPEDA 4.3.3** - Consent must be granular for different purposes.

**No changes needed.**

---

### ✅ P1 (GOOD): Default Values Enforce Opt-In

**File:** `schema.prisma:84-88`, `migration.sql:7-11`
**Issue:** None — this is **correct design**.

All consent flags default to `false`, forcing explicit opt-in:

```prisma
autoCreateBills            Boolean  @default(false)
autoCreateInvoices         Boolean  @default(false)
autoMatchTransactions      Boolean  @default(false)
autoCategorize             Boolean  @default(false)
useCorrectionsForLearning  Boolean  @default(false)
```

**Why This is Good:**

- **GDPR Article 4(11)** - Consent must be freely given. Pre-checked boxes = invalid consent.
- **PIPEDA 4.3.6** - Implicit consent is only valid for non-sensitive data. Financial AI automation = sensitive.
- Akount's approach is **gold standard** for consent UX.

**No changes needed.**

---

### ✅ P2 (GOOD): Composite Index Supports Multi-Tenant Queries

**File:** `schema.prisma:98`, `migration.sql:28`
**Issue:** None — this is efficient indexing.

```prisma
@@index([userId, tenantId])
```

**Why This is Good:**

- Query pattern: "Get consent settings for user X in tenant Y" is common during request middleware.
- Composite index allows efficient lookup without scanning.
- Prevents N+1 queries in multi-tenant scenarios.

**No changes needed.**

---

### ✅ P2 (GOOD): Unique Constraint on userId Prevents Duplicate Consent Records

**File:** `schema.prisma:81`, `migration.sql:19`
**Issue:** None — this prevents data corruption.

```prisma
userId String @unique
```

**Why This is Good:**

- Enforces 1:1 relationship between User and AIConsent.
- Prevents race conditions where parallel requests create duplicate consent records.
- Unique index is efficient for lookups.

**Note:** This assumes **one consent record per user across all tenants**. If a user can belong to multiple tenants with different consent settings per tenant, this should be a composite unique constraint instead:

```prisma
@@unique([userId, tenantId])
```

**Question for Product Team:** Should consent be **user-global** (current design) or **per-tenant** (each tenant membership has separate consent)?

If per-tenant is required, change:
```prisma
// Remove: userId String @unique
// Add: @@unique([userId, tenantId])
```

---

### ⚠️ P2 (RECOMMENDATION): Missing Audit Trail for Consent Changes

**File:** `schema.prisma:79-99`
**Issue:** The AIConsent model tracks **current state** but not **history of changes**.

**Why This Matters:**

- GDPR Article 7(1) requires being able to **demonstrate** that consent was obtained.
- If a user toggles `autoCreateBills` on (Jan 1) → off (Feb 1) → on (Mar 1), only the current state (`true`) is visible.
- Cannot prove when consent was granted/revoked for audit purposes.

**Recommendation:** Add a `ConsentHistory` or `AIConsentLog` table:

```prisma
model AIConsentHistory {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  field     String   // "autoCreateBills", "autoCategorize", etc.
  oldValue  Boolean
  newValue  Boolean
  changedAt DateTime @default(now())
  changedBy String?  // User ID who made the change (for admin overrides)

  @@index([userId, tenantId, changedAt])
  @@index([field, changedAt])
}
```

This can be populated via application-level triggers (not DB triggers, for simplicity).

---

### ✅ P2 (GOOD): createdAt and updatedAt Provide Basic Timestamps

**File:** `schema.prisma:90-91`
**Issue:** None — standard practice.

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Why This is Good:**

- `createdAt` proves when consent was initially granted (GDPR Article 7 requirement).
- `updatedAt` shows when settings were last modified.

**Limitation:** `updatedAt` only shows **when**, not **what changed** or **why**. See P2 recommendation above for full audit trail.

**No changes needed for MVP.**

---

### ✅ P2 (GOOD): Migration is Idempotent and Rollback-Safe

**File:** `migration.sql:1-35`
**Issue:** None — migration follows best practices.

**Why This is Good:**

- No `DROP TABLE IF EXISTS` — Prisma generates non-destructive DDL.
- All DDL operations are atomic within the migration transaction.
- Foreign key constraints added **after** table creation (correct order).
- Indexes created **after** table and constraints.

**Rollback Strategy:**

If migration needs to be rolled back:
```sql
DROP TABLE "AIConsent";
-- No data loss (table was newly created, no prior data)
```

**No changes needed.**

---

## Required Changes Before Merge

### 1. Change CASCADE to RESTRICT (CRITICAL)

**Schema Fix:**
```prisma
// File: packages/db/prisma/schema.prisma

// Line 93 - Change:
user User @relation(fields: [userId], references: [id], onDelete: Restrict)

// Line 94 - Change:
tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Restrict)
```

**Migration Fix:**

Create a new migration:
```bash
cd packages/db
npx prisma migrate dev --name fix_ai_consent_cascade_deletes
```

The generated migration should contain:
```sql
-- Fix CASCADE deletes to RESTRICT for audit compliance

ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_userId_fkey";
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_tenantId_fkey";
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```

**Why NOT Cascade:**

When User/Tenant is deleted:
- Financial records (Invoice, Bill, JournalEntry) use soft delete (`deletedAt`) — never CASCADE.
- Consent records are **equally critical** for compliance.
- CASCADE delete = destroy evidence of lawful processing.

**Service Layer Impact:**

After this change, User deletion service must explicitly handle AIConsent:

```typescript
// In user.service.ts (or tenant.service.ts)

async function deleteUser(userId: string) {
  // 1. Archive or export consent record
  const consent = await prisma.aiConsent.findUnique({ where: { userId } });
  if (consent) {
    await archiveConsent(consent); // Or export to compliance storage
    await prisma.aiConsent.delete({ where: { userId } });
  }

  // 2. Now safe to delete user
  await prisma.user.delete({ where: { id: userId } });
}
```

---

### 2. Clarify userId Uniqueness Scope (QUESTION FOR PRODUCT)

**Decision Needed:** Is consent **user-global** or **per-tenant**?

**Current Design (user-global):**
```prisma
userId String @unique
```
→ One user, one consent record across all tenants.

**Alternative (per-tenant):**
```prisma
// Remove: userId String @unique
// Add: @@unique([userId, tenantId])
```
→ One user can have different consent settings in different tenants.

**Recommendation:** Per-tenant is more flexible and aligns with multi-tenancy isolation. A user might want auto-categorize enabled in their personal tenant but disabled in their business tenant.

If per-tenant is chosen, create migration:
```sql
ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_userId_key";
CREATE UNIQUE INDEX "AIConsent_userId_tenantId_key" ON "AIConsent"("userId", "tenantId");
```

---

## Approval Status

**Status:** ⚠️ **CHANGES REQUIRED**

**Reason:**

1. **CRITICAL:** CASCADE delete on User/Tenant relations violates GDPR/PIPEDA retention requirements for consent records.
2. **DECISION NEEDED:** Clarify if consent is user-global or per-tenant (impacts uniqueness constraint).

**After Fixes Applied:**

- [ ] Change `onDelete: Cascade` → `onDelete: Restrict` on both User and Tenant relations
- [ ] Create follow-up migration `fix_ai_consent_cascade_deletes`
- [ ] Update User/Tenant deletion services to explicitly handle AIConsent archival
- [ ] Document consent archival policy (30 days? 7 years?)
- [ ] Decide on user-global vs per-tenant consent scope
- [ ] (Optional) Add AIConsentHistory table for full audit trail

**Then:** Status → ✅ **APPROVED**

---

## Summary Table

| Finding | Severity | Status |
|---------|----------|--------|
| CASCADE delete on User relation | P0 CRITICAL | ❌ MUST FIX |
| CASCADE delete on Tenant relation | P0 CRITICAL | ❌ MUST FIX |
| Granular consent toggles | P1 GOOD | ✅ CORRECT |
| Default values enforce opt-in | P1 GOOD | ✅ CORRECT |
| Composite index | P2 GOOD | ✅ CORRECT |
| Unique userId constraint | P2 GOOD | ⚠️ CLARIFY SCOPE |
| Missing consent history | P2 RECOMMENDATION | 📋 FUTURE |
| createdAt/updatedAt timestamps | P2 GOOD | ✅ CORRECT |
| Migration safety | P2 GOOD | ✅ CORRECT |

---

**Next Steps:**

1. Apply CASCADE → RESTRICT fix immediately
2. Discuss consent scope (global vs per-tenant) with product team
3. Document consent retention policy
4. Consider AIConsentHistory table for Phase 2

**Estimated Fix Time:** 30 minutes (schema change + migration + service layer update)
