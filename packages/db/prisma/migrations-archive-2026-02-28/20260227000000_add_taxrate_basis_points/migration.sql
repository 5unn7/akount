-- Migration: Add TaxRate.rateBasisPoints column with data backfill
-- Task: FIN-32 - Migrate TaxRate.rate from Float to Int (basis points)
-- Created: 2026-02-27
-- Risk: HIGH (data migration with conversion)
--
-- Purpose:
--   Add rateBasisPoints (Int) column alongside existing rate (Float) column.
--   This is step 1 of a zero-downtime dual-column migration strategy.
--
-- Conversion formula: rateBasisPoints = ROUND(rate * 10000)
--   - 0.05 (5%) → 500 basis points
--   - 0.13 (13%) → 1300 basis points
--
-- Rollback:
--   ALTER TABLE "TaxRate" DROP COLUMN IF EXISTS "rateBasisPoints";

-- Add new column (nullable initially for backfill)
ALTER TABLE "TaxRate" ADD COLUMN IF NOT EXISTS "rateBasisPoints" INTEGER;

-- Backfill: Convert existing rate values to basis points
UPDATE "TaxRate"
SET "rateBasisPoints" = ROUND(rate * 10000)
WHERE "rateBasisPoints" IS NULL;

-- Verify no NULL values remain
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "TaxRate" WHERE "rateBasisPoints" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % rows have NULL rateBasisPoints after backfill', null_count;
  END IF;
  RAISE NOTICE 'Verification passed: 0 NULL values ✓';
END $$;

-- Add NOT NULL constraint after verification
ALTER TABLE "TaxRate" ALTER COLUMN "rateBasisPoints" SET NOT NULL;

-- Migration complete
DO $$ BEGIN
  RAISE NOTICE 'Migration 20260227000000_add_taxrate_basis_points complete ✓';
  RAISE NOTICE 'Next: Update code to read rateBasisPoints, then drop old rate column';
END $$;
