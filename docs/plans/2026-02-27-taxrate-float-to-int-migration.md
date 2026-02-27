# TaxRate.rate Float→Int Migration Plan (FIN-32)

**Created:** 2026-02-27
**Status:** Planning
**Task:** FIN-32
**Risk Level:** HIGH (data migration + schema change)
**Estimated Time:** 4 hours

---

## Overview

Migrate `TaxRate.rate` from `Float` (decimal: 0.05 = 5%) to `Int` (basis points: 500 = 5%) to eliminate floating-point precision issues and align with the integer-cents financial data standard.

**Current state:** `rate: Float` (0.05 = 5%, 0.13 = 13%)
**Target state:** `rate: Int` (500 = 5%, 1300 = 13%)
**Conversion formula:** `newRate = Math.round(oldRate * 10000)`

---

## Success Criteria

- [ ] Schema migrated: `TaxRate.rate` is `Int` in Prisma schema
- [ ] All existing tax rate data converted (multiply by 10000, rounded)
- [ ] No precision loss in conversion (verify before/after)
- [ ] Service layer uses basis points (500 = 5%)
- [ ] API schema validates `0 <= rate <= 10000` (0-100%)
- [ ] Frontend displays correctly: `rate / 100` = "5.00%"
- [ ] All tests pass (update mocks to use basis points)
- [ ] TypeScript compiles with no errors
- [ ] Audit logs preserve pre-migration rate values for forensics

---

## Affected Files

### Schema & Migration (2 files)
- `packages/db/prisma/schema.prisma` — Change `rate Float` to `rate Int`
- `packages/db/prisma/migrations/YYYYMMDD_taxrate_to_basis_points/migration.sql` — ALTER + data conversion

### Backend (5 files)
- `apps/api/src/domains/accounting/services/tax-rate.service.ts` — No conversion needed (passes through)
- `apps/api/src/domains/accounting/schemas/tax-rate.schema.ts` — Update Zod: `.max(1)` → `.max(10000)`
- `apps/api/src/domains/accounting/__tests__/tax-rate.service.test.ts` — Update mocks
- `apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts` — Update mocks
- `apps/api/src/domains/invoicing/services/invoice.service.ts` — **Check usage** (calculates tax)
- `apps/api/src/domains/invoicing/services/bill.service.ts` — **Check usage** (calculates tax)

### Frontend (4 files)
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rate-sheet.tsx` — Convert display/input (line 72, 91, 96)
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-client.tsx` — Convert display (line 265, 304)
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-empty.tsx` — Convert preset display (line 272-273)
- `apps/web/src/components/line-item-builder.tsx` — Convert dropdown display (line 214)

### Test Files (4 files)
- `apps/api/src/domains/invoicing/__tests__/invoice.service.test.ts` — Update rate mocks
- `apps/api/src/domains/invoicing/__tests__/bill.service.test.ts` — Update rate mocks
- `apps/api/src/domains/__tests__/flows/invoice-lifecycle.flow.test.ts` — Update rate mocks
- `apps/api/src/domains/__tests__/flows/bill-lifecycle.flow.test.ts` — Update rate mocks

---

## Migration Strategy

### Phase 1: Preparation (No Code Changes)

**Backup existing data:**
```sql
-- Export current tax rates for rollback
COPY (SELECT * FROM "TaxRate") TO '/tmp/taxrate_backup_20260227.csv' CSV HEADER;
```

**Analyze data distribution:**
```sql
SELECT
  COUNT(*) as total,
  MIN(rate) as min_rate,
  MAX(rate) as max_rate,
  AVG(rate) as avg_rate,
  COUNT(DISTINCT rate) as unique_rates
FROM "TaxRate";
```

**Check for precision-sensitive rates:**
```sql
-- Find rates that might lose precision in conversion
SELECT id, code, rate, ROUND(rate * 10000) as new_rate
FROM "TaxRate"
WHERE ABS(rate * 10000 - ROUND(rate * 10000)) > 0.0001;
```

### Phase 2: Database Migration

**Strategy:** Three-step migration (safe, reversible)

**Step 1: Add new column**
```sql
ALTER TABLE "TaxRate" ADD COLUMN "rateBasisPoints" INTEGER;
```

**Step 2: Backfill data**
```sql
UPDATE "TaxRate"
SET "rateBasisPoints" = ROUND(rate * 10000);
```

**Step 3: Verify conversion**
```sql
-- Check no data loss
SELECT COUNT(*) FROM "TaxRate" WHERE "rateBasisPoints" IS NULL;

-- Verify conversion accuracy
SELECT id, code, rate, "rateBasisPoints",
       ABS(rate - ("rateBasisPoints"::float / 10000)) as diff
FROM "TaxRate"
WHERE ABS(rate - ("rateBasisPoints"::float / 10000)) > 0.0001;
```

**Step 4: Swap columns** (after code deployed)
```sql
-- Drop old column, rename new column
ALTER TABLE "TaxRate" DROP COLUMN rate;
ALTER TABLE "TaxRate" RENAME COLUMN "rateBasisPoints" TO rate;
```

### Phase 3: Code Updates

Deploy code changes BETWEEN Step 3 and Step 4:
- Both columns exist during deployment
- Code reads from new `rateBasisPoints` column
- After deploy verified, drop old `rate` column

---

## Tasks

### Task 1: Create Migration Script with Data Backup

**File:** `packages/db/prisma/migrations/YYYYMMDD_add_taxrate_basis_points/migration.sql`
**What:** Add `rateBasisPoints` column, backfill data, verify conversion
**Depends on:** none
**Risk:** HIGH (data migration)
**Review:** `prisma-migration-reviewer`, `data-migration-expert`
**Success:** New column exists, all rows have values, conversion verified

**SQL:**
```sql
-- Step 1: Add new column
ALTER TABLE "TaxRate" ADD COLUMN "rateBasisPoints" INTEGER;

-- Step 2: Backfill existing data (rate * 10000)
UPDATE "TaxRate"
SET "rateBasisPoints" = ROUND(rate * 10000);

-- Step 3: Verify no nulls
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "TaxRate" WHERE "rateBasisPoints" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % rows have NULL rateBasisPoints', null_count;
  END IF;
END $$;

-- Step 4: Add NOT NULL constraint
ALTER TABLE "TaxRate" ALTER COLUMN "rateBasisPoints" SET NOT NULL;
```

---

### Task 2: Update Prisma Schema (Temporary Dual-Column State)

**File:** `packages/db/prisma/schema.prisma`
**What:** Add `rateBasisPoints Int` field alongside existing `rate Float`
**Depends on:** Task 1
**Risk:** medium
**Success:** Schema includes both fields, `prisma generate` succeeds

**Changes:**
```prisma
model TaxRate {
  // ... other fields
  rate            Float  // OLD - will be removed in Task 7
  rateBasisPoints Int    // NEW - basis points (500 = 5%)
  // ... other fields
}
```

---

### Task 3: Update Backend Schemas (Zod Validation)

**File:** `apps/api/src/domains/accounting/schemas/tax-rate.schema.ts`
**What:** Update validation to accept basis points (0-10000 instead of 0-1)
**Depends on:** Task 2
**Risk:** medium
**Review:** `fastify-api-reviewer`
**Success:** Schema validates basis points, rejects values >10000

**Changes:**
```typescript
// Line 24-27: Update CreateTaxRateSchema
rate: z
    .number()
    .int('Rate must be an integer (basis points)')
    .min(0, 'Rate must be non-negative')
    .max(10000, 'Rate must be 10000 (100%) or less'),

// Line 42: Update UpdateTaxRateSchema
rate: z.number().int().min(0).max(10000).optional(),
```

---

### Task 4: Update Backend Service (Read from New Column)

**File:** `apps/api/src/domains/accounting/services/tax-rate.service.ts`
**What:** Update SELECT constant and service methods to use `rateBasisPoints`
**Depends on:** Task 3
**Risk:** low (pass-through, no calculation)
**Success:** Service returns basis points, API contract unchanged

**Changes:**
```typescript
// Line 12-26: Update TAX_RATE_SELECT
const TAX_RATE_SELECT = {
    // ... other fields
    rateBasisPoints: true,  // NEW
    // ... other fields
} as const;

// Line 143, 229: Service passes through basis points (no conversion)
// No changes needed in createTaxRate/updateTaxRate — just pass data.rate
```

**Note:** Service layer does NOT convert — it stores basis points as-is. Frontend handles display conversion.

---

### Task 5: Update Frontend Display (Convert Basis Points → Percentage)

**Files:**
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rate-sheet.tsx`
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-client.tsx`
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-empty.tsx`
- `apps/web/src/components/line-item-builder.tsx`

**What:** Convert basis points to percentage for display (divide by 100)
**Depends on:** Task 4
**Risk:** medium (breaking change if wrong)
**Review:** `nextjs-app-router-reviewer`
**Success:** Tax rates display correctly (500 → "5.00%", 1300 → "13.00%")

**Pattern:**
```typescript
// OLD: rate is decimal (0.05 = 5%)
const displayPercent = (rate.rate * 100).toFixed(2);  // "5.00"

// NEW: rate is basis points (500 = 5%)
const displayPercent = (rate.rateBasisPoints / 100).toFixed(2);  // "5.00"
```

**Files to update:**

1. **tax-rate-sheet.tsx** (line 72, 91, 96):
   ```typescript
   // Line 72: Display conversion
   setRatePercent(String(editingRate.rateBasisPoints / 100));

   // Line 91, 96: Input conversion (user enters "5" → store 500)
   const rateBasisPoints = Math.round(parseFloat(ratePercent) * 100);
   ```

2. **tax-rates-client.tsx** (line 265, 304):
   ```typescript
   // Line 265: Display
   const ratePercent = (rate.rateBasisPoints / 100).toFixed(
       rate.rateBasisPoints % 100 === 0 ? 0 : 2
   );

   // Line 304: Visual bar width
   style={{ width: `${Math.min(rate.rateBasisPoints / 25, 100)}%` }}
   ```

3. **tax-rates-empty.tsx** (line 272-273):
   ```typescript
   {(preset.rateBasisPoints / 100).toFixed(
       preset.rateBasisPoints % 100 === 0 ? 0 : 2
   )}%
   ```

4. **line-item-builder.tsx** (line 214):
   ```typescript
   {rate.code} ({(rate.rateBasisPoints / 100).toFixed(
       rate.rateBasisPoints % 100 === 0 ? 0 : 1
   )}%)
   ```

---

### Task 6: Update All Test Mocks

**Files:** All test files with tax rate mocks (8+ files)
**What:** Change rate values from decimals to basis points
**Depends on:** Task 5
**Risk:** low (tests only)
**Success:** All tests pass with basis point mocks

**Pattern:**
```typescript
// OLD
const mockTaxRate = { rate: 0.05 };  // 5%

// NEW
const mockTaxRate = { rateBasisPoints: 500 };  // 5%
```

**Files to update:**
- `apps/api/src/domains/accounting/__tests__/tax-rate.service.test.ts`
- `apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts`
- `apps/api/src/domains/invoicing/__tests__/invoice.service.test.ts`
- `apps/api/src/domains/invoicing/__tests__/bill.service.test.ts`
- `apps/api/src/domains/__tests__/flows/invoice-lifecycle.flow.test.ts`
- `apps/api/src/domains/__tests__/flows/bill-lifecycle.flow.test.ts`
- Any other tests using TaxRate mocks

---

### Task 7: Remove Old Column (Final Migration Step)

**File:** `packages/db/prisma/migrations/YYYYMMDD_remove_old_rate_column/migration.sql`
**What:** Drop old `rate Float` column, rename `rateBasisPoints` to `rate`
**Depends on:** Task 6 (all code deployed and verified)
**Risk:** HIGH (irreversible - requires backup)
**Review:** `prisma-migration-reviewer`, `data-migration-expert`
**Success:** Schema clean, only `rate Int` remains

**SQL:**
```sql
-- Drop old Float column
ALTER TABLE "TaxRate" DROP COLUMN rate;

-- Rename new column to canonical name
ALTER TABLE "TaxRate" RENAME COLUMN "rateBasisPoints" TO rate;
```

---

### Task 8: Final Schema Cleanup

**File:** `packages/db/prisma/schema.prisma`
**What:** Remove `rate Float`, rename `rateBasisPoints` to `rate Int`
**Depends on:** Task 7
**Risk:** low
**Success:** Schema matches database, `prisma generate` succeeds

**Final schema:**
```prisma
model TaxRate {
  id            String    @id @default(cuid())
  entityId      String?
  code          String
  name          String
  rate          Int       // Basis points (500 = 5%)
  jurisdiction  String
  isInclusive   Boolean
  glAccountId   String?
  isActive      Boolean
  effectiveFrom DateTime
  effectiveTo   DateTime?
  entity        Entity?       @relation(fields: [entityId], references: [id])
  invoiceLines  InvoiceLine[] @relation("InvoiceLineTaxRate")
  billLines     BillLine[]    @relation("BillLineTaxRate")

  @@unique([entityId, code])
  @@index([entityId, isActive])
  @@index([jurisdiction])
}
```

---

### Task 9: Update TypeScript Types & API Contracts

**File:** `packages/types/src/accounting.ts` (if exists)
**What:** Update TaxRate type exports to reflect Int rate
**Depends on:** Task 8
**Risk:** low
**Success:** Type exports match schema

---

### Task 10: Run Full Test Suite

**Command:** `npm run test` (API + Web)
**What:** Verify all tests pass with basis points
**Depends on:** Task 9
**Risk:** medium (might reveal missed conversions)
**Success:** 0 failed tests, TypeScript compiles clean

---

## Reference Files

**Schema:**
- `packages/db/prisma/schema.prisma:222-241` — TaxRate model

**Backend:**
- `apps/api/src/domains/accounting/services/tax-rate.service.ts` — Service implementation
- `apps/api/src/domains/accounting/schemas/tax-rate.schema.ts` — Zod schemas

**Frontend:**
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rate-sheet.tsx` — Create/edit form
- `apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-client.tsx` — Tax rate cards

**Invoice/Bill calculation** (CHECK these use TaxRate correctly):
- `apps/api/src/domains/invoicing/services/invoice.service.ts`
- `apps/api/src/domains/invoicing/services/bill.service.ts`

---

## Edge Cases

### Precision Loss During Conversion

**Problem:** Some rates might lose precision when converted (e.g., 0.0567 → 567 basis points = 5.67%, not 5.667%)

**Mitigation:**
- Round to nearest integer during migration
- Log any rates with >0.01% precision loss for manual review
- Acceptable for tax rates (precision to 0.01% is sufficient)

### Existing Invoice/Bill Lines

**Problem:** InvoiceLine and BillLine have `taxRateId` FK but don't store calculated `taxAmount` separately if it was computed.

**Check:** Do these models cache calculated tax or recalculate on read?

**Mitigation:**
- If cached: recalculate all taxAmount fields with new basis points
- If computed: no action needed (will auto-recalculate with new rate)

### Global Tax Rates (`entityId: null`)

**Problem:** Global rates are read-only for tenants, managed by system admins.

**Mitigation:**
- Migration converts global rates too
- Tenants cannot mutate global rates (already enforced in service)
- No special handling needed

### Zero Rates

**Problem:** `rate: 0` (0%) is valid (exempt items).

**Mitigation:**
- `0 * 10000 = 0` (safe conversion)
- Validation allows `rate >= 0`

---

## Deployment Strategy

### Option A: Zero-Downtime (Recommended)

1. **Deploy migration Task 1** (add new column, backfill)
2. **Deploy code Tasks 2-6** (read from new column, both columns exist)
3. **Monitor for 24h** (verify no errors, conversion correct)
4. **Deploy migration Task 7** (drop old column)
5. **Deploy schema Task 8** (clean up Prisma schema)

**Downtime:** None (dual-column period)
**Rollback:** Easy (revert to old column before Task 7)

### Option B: Maintenance Window

1. **Take API offline** (maintenance mode)
2. **Run all migrations** (Tasks 1 + 7 combined)
3. **Deploy all code** (Tasks 2-6, 8)
4. **Run tests**
5. **Bring API online**

**Downtime:** ~10-15 minutes
**Rollback:** Restore from backup

**Recommendation:** Use Option A (zero-downtime) for production-ready migration.

---

## Testing Strategy

### Unit Tests

Update all TaxRate mocks to use basis points:
```typescript
// OLD
const mockTaxRate = { rate: 0.13 };  // 13%

// NEW
const mockTaxRate = { rateBasisPoints: 1300 };  // 13%
```

### Integration Tests

Test full invoice/bill creation flow:
1. Create tax rate (13% = 1300 basis points)
2. Create invoice with tax rate
3. Verify taxAmount calculated correctly
4. Post to GL, verify journal entries

### Manual Verification

After deployment:
1. List tax rates in UI → verify display (500 → "5.00%")
2. Create new tax rate via UI → verify storage (input "7.5" → stores 750)
3. Edit existing tax rate → verify round-trip (load 500 → display "5" → save 500)
4. Create invoice with tax → verify tax calculation uses basis points

---

## Rollback Plan

### Before Task 7 (Old Column Still Exists)

**Easy rollback:**
```sql
-- Revert code to read from old 'rate' column
-- Drop new column
ALTER TABLE "TaxRate" DROP COLUMN "rateBasisPoints";
```

### After Task 7 (Old Column Dropped)

**Requires backup restore:**
```sql
-- Restore from backup
ALTER TABLE "TaxRate" ADD COLUMN rate FLOAT;
UPDATE "TaxRate" SET rate = "rateBasisPoints"::float / 10000;
ALTER TABLE "TaxRate" DROP COLUMN "rateBasisPoints";
-- Restore old code
```

**Always backup before Task 7!**

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 1 | `prisma-migration-reviewer`, `data-migration-expert` |
| Task 2 | `prisma-migration-reviewer` |
| Task 3 | `fastify-api-reviewer` |
| Task 5 | `nextjs-app-router-reviewer`, `kieran-typescript-reviewer` |
| Task 7 | `data-migration-expert` |

---

## Domain Impact

**Primary domain:** Accounting (TaxRate model)

**Adjacent domains affected:**
- **Invoicing** — Uses TaxRate for invoice line tax calculation
- **Vendors** — Uses TaxRate for bill line tax calculation
- **Frontend** — All tax rate displays and forms

**Cross-cutting concerns:**
- API contract change (rate validation changes)
- Database migration (all environments)
- TypeScript types (regenerated from Prisma)

---

## Data Safety Checklist

- [ ] Backup exported to `/tmp/taxrate_backup_YYYYMMDD.csv`
- [ ] Conversion verified (no precision loss >0.01%)
- [ ] Test environment migration successful
- [ ] All tests passing before production migration
- [ ] Rollback plan tested in dev environment
- [ ] Monitoring alerts configured (watch for 400 errors from validation)

---

## Progress

- [x] Task 1: Create migration with data backup ✅
  - **File:** `packages/db/prisma/migrations/20260227000000_add_taxrate_basis_points/migration.sql`
  - **Size:** 8.1KB (comprehensive verification and rollback instructions)
  - **Features:** Pre-migration snapshot, precision loss detection, sample conversions, row count verification
  - **Safety:** Dual-column strategy, NOT NULL constraint added after verification, clear rollback instructions
- [ ] Task 2: Update Prisma schema (dual-column)
- [ ] Task 3: Update backend schemas (Zod validation)
- [ ] Task 4: Update backend service (read new column)
- [ ] Task 5: Update frontend display (convert to percentage)
- [ ] Task 6: Update all test mocks
- [ ] Task 7: Remove old column (final migration)
- [ ] Task 8: Final schema cleanup
- [ ] Task 9: Update TypeScript types
- [ ] Task 10: Run full test suite

---

## Known Risks

1. **Precision loss:** Rates like 0.0567 round to 567 basis points (5.67% vs 5.667%)
   - **Mitigation:** Acceptable precision loss for tax rates
2. **Breaking API change:** Clients sending decimal rates will get validation errors
   - **Mitigation:** Deploy frontend + backend together
3. **Cached tax calculations:** If invoice/bill cache taxAmount, they'll be wrong
   - **Mitigation:** Verify these models recompute tax on read, or recalculate
4. **Global rate mutations:** Migration must convert global rates too
   - **Mitigation:** Conversion applies to ALL rows (global + entity-specific)

---

**Estimated Total Time:** 4 hours
**Recommended Approach:** Zero-downtime dual-column migration (Option A)
**Next Step:** Execute Task 1 (create migration script with backup)
