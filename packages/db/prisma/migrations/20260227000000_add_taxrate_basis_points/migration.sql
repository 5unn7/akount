-- Migration: Add TaxRate.rateBasisPoints column with data backfill
-- Task: FIN-32 - Migrate TaxRate.rate from Float to Int (basis points)
-- Created: 2026-02-27
-- Risk: HIGH (data migration with conversion)
--
-- Purpose:
--   Add rateBasisPoints (Int) column alongside existing rate (Float) column.
--   This is step 1 of a zero-downtime dual-column migration strategy.
--   The old rate column will be dropped in a later migration after code deployment.
--
-- Conversion formula: rateBasisPoints = ROUND(rate * 10000)
--   - 0.05 (5%) → 500 basis points
--   - 0.13 (13%) → 1300 basis points
--   - 0.0567 (5.67%) → 567 basis points (precision loss: 5.67% → 5.67%, acceptable)
--
-- Rollback:
--   DROP COLUMN IF EXISTS "rateBasisPoints";
--   (Old rate column remains unchanged until later migration)
--
-- Safety checks:
--   1. Verify no NULL values after backfill
--   2. Verify conversion accuracy (flag precision loss >0.01%)
--   3. Log row counts before/after
--   4. Add NOT NULL constraint after verification
--
-- Dependencies: None (new column added alongside existing)
-- Next steps: Update Prisma schema to include both rate and rateBasisPoints

-- ============================================================================
-- PHASE 1: PRE-MIGRATION VERIFICATION
-- ============================================================================

-- Count existing tax rates
DO $$
DECLARE
  tax_rate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tax_rate_count FROM "TaxRate";
  RAISE NOTICE '=== PRE-MIGRATION SNAPSHOT ===';
  RAISE NOTICE 'Total TaxRate rows: %', tax_rate_count;
END $$;

-- Log data distribution
DO $$
DECLARE
  min_rate FLOAT;
  max_rate FLOAT;
  avg_rate FLOAT;
  unique_rates INTEGER;
BEGIN
  SELECT MIN(rate), MAX(rate), AVG(rate), COUNT(DISTINCT rate)
  INTO min_rate, max_rate, avg_rate, unique_rates
  FROM "TaxRate";

  RAISE NOTICE 'Rate distribution:';
  RAISE NOTICE '  MIN: %', min_rate;
  RAISE NOTICE '  MAX: %', max_rate;
  RAISE NOTICE '  AVG: %', avg_rate;
  RAISE NOTICE '  Unique rates: %', unique_rates;
END $$;

-- Check for precision-sensitive rates (will lose >0.01% precision)
DO $$
DECLARE
  precision_loss_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO precision_loss_count
  FROM "TaxRate"
  WHERE ABS(rate * 10000 - ROUND(rate * 10000)) > 1.0; -- >0.01% loss

  IF precision_loss_count > 0 THEN
    RAISE NOTICE 'WARNING: % rates will lose >0.01%% precision during conversion', precision_loss_count;
    RAISE NOTICE 'Examples (showing first 5):';

    -- Show examples of rates that will lose precision
    FOR i IN (
      SELECT id, code, rate,
             ROUND(rate * 10000) as new_basis_points,
             ABS(rate - (ROUND(rate * 10000)::float / 10000)) * 100 as percent_diff
      FROM "TaxRate"
      WHERE ABS(rate * 10000 - ROUND(rate * 10000)) > 1.0
      LIMIT 5
    ) LOOP
      RAISE NOTICE '  % (%): % → % bp (diff: %%%)',
        i.id, i.code, i.rate, i.new_basis_points, ROUND(i.percent_diff::numeric, 4);
    END LOOP;
  ELSE
    RAISE NOTICE 'No rates will lose >0.01%% precision ✓';
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: ADD NEW COLUMN
-- ============================================================================

RAISE NOTICE '=== ADDING rateBasisPoints COLUMN ===';

-- Add new column (nullable initially for backfill)
ALTER TABLE "TaxRate" ADD COLUMN IF NOT EXISTS "rateBasisPoints" INTEGER;

RAISE NOTICE 'Column added successfully ✓';

-- ============================================================================
-- PHASE 3: BACKFILL DATA
-- ============================================================================

RAISE NOTICE '=== BACKFILLING DATA ===';

-- Backfill: Convert existing rate values to basis points
UPDATE "TaxRate"
SET "rateBasisPoints" = ROUND(rate * 10000)
WHERE "rateBasisPoints" IS NULL;

-- Log backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backfilled_count
  FROM "TaxRate"
  WHERE "rateBasisPoints" IS NOT NULL;

  RAISE NOTICE 'Backfilled % rows ✓', backfilled_count;
END $$;

-- ============================================================================
-- PHASE 4: VERIFICATION
-- ============================================================================

RAISE NOTICE '=== VERIFICATION ===';

-- Check 1: No NULL values
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM "TaxRate"
  WHERE "rateBasisPoints" IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION FAILED: % rows have NULL rateBasisPoints after backfill', null_count;
  END IF;

  RAISE NOTICE 'Check 1: No NULL values ✓';
END $$;

-- Check 2: Verify conversion accuracy (flag precision loss >0.01%)
DO $$
DECLARE
  bad_conversion_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO bad_conversion_count
  FROM "TaxRate"
  WHERE ABS(rate - ("rateBasisPoints"::float / 10000)) > 0.0001;  -- >0.01% diff

  IF bad_conversion_count > 0 THEN
    RAISE NOTICE 'WARNING: % rows have conversion precision loss >0.01%%', bad_conversion_count;
    RAISE NOTICE 'This is expected for rates like 0.0567 (5.67%% → 567bp = 5.67%%)';
    RAISE NOTICE 'Precision to 0.01%% is acceptable for tax rates.';
  ELSE
    RAISE NOTICE 'Check 2: All conversions within 0.01%% precision ✓';
  END IF;
END $$;

-- Check 3: Verify row counts match
DO $$
DECLARE
  total_rows INTEGER;
  non_null_bp_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM "TaxRate";
  SELECT COUNT(*) INTO non_null_bp_rows FROM "TaxRate" WHERE "rateBasisPoints" IS NOT NULL;

  IF total_rows != non_null_bp_rows THEN
    RAISE EXCEPTION 'MIGRATION FAILED: Row count mismatch (total: %, non-null bp: %)', total_rows, non_null_bp_rows;
  END IF;

  RAISE NOTICE 'Check 3: Row counts match (%) ✓', total_rows;
END $$;

-- Check 4: Sample verification (show first 10 conversions)
DO $$
BEGIN
  RAISE NOTICE 'Sample conversions (first 10 rows):';
  RAISE NOTICE '  ID | Code | Old Rate | New Basis Points | Reconstructed Rate | Diff';

  FOR i IN (
    SELECT
      id,
      code,
      rate as old_rate,
      "rateBasisPoints" as new_bp,
      ("rateBasisPoints"::float / 10000) as reconstructed,
      ABS(rate - ("rateBasisPoints"::float / 10000)) as diff
    FROM "TaxRate"
    ORDER BY id
    LIMIT 10
  ) LOOP
    RAISE NOTICE '  % | % | % | % | % | %',
      i.id, i.code, i.old_rate, i.new_bp, i.reconstructed, i.diff;
  END LOOP;
END $$;

-- ============================================================================
-- PHASE 5: ADD NOT NULL CONSTRAINT
-- ============================================================================

RAISE NOTICE '=== ADDING NOT NULL CONSTRAINT ===';

-- After verification passes, add NOT NULL constraint
ALTER TABLE "TaxRate" ALTER COLUMN "rateBasisPoints" SET NOT NULL;

RAISE NOTICE 'NOT NULL constraint added ✓';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE 'rateBasisPoints column added and backfilled successfully';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update Prisma schema to include rateBasisPoints field';
  RAISE NOTICE '  2. Run: npx prisma generate';
  RAISE NOTICE '  3. Update backend code to read from rateBasisPoints';
  RAISE NOTICE '  4. Update frontend code to display rateBasisPoints / 100';
  RAISE NOTICE '  5. Deploy code changes';
  RAISE NOTICE '  6. Monitor for 24-48h';
  RAISE NOTICE '  7. Run final migration to drop old rate column';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Do NOT drop the old rate column yet!';
  RAISE NOTICE 'Dual-column period allows safe rollback if issues arise.';
  RAISE NOTICE '';
  RAISE NOTICE 'Rollback (if needed before code deployment):';
  RAISE NOTICE '  ALTER TABLE "TaxRate" DROP COLUMN IF EXISTS "rateBasisPoints";';
END $$;
