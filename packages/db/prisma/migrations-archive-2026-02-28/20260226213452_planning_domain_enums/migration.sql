-- ==========================================================================
-- Baseline: Create tables that were added via db push (shadow DB replay fix)
-- ==========================================================================

-- Forecast table
CREATE TABLE IF NOT EXISTS "Forecast" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "assumptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Forecast_entityId_idx" ON "Forecast"("entityId");
CREATE INDEX IF NOT EXISTS "Forecast_type_scenario_idx" ON "Forecast"("type", "scenario");
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FixedAsset table
CREATE TABLE IF NOT EXISTS "FixedAsset" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "acquiredDate" TIMESTAMP(3) NOT NULL,
    "cost" INTEGER NOT NULL,
    "salvageValue" INTEGER NOT NULL,
    "usefulLifeMonths" INTEGER NOT NULL,
    "depreciationMethod" TEXT NOT NULL,
    "accumulatedDepreciation" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "disposedDate" TIMESTAMP(3),
    "disposalAmount" INTEGER,
    "assetGLAccountId" TEXT,
    "depreciationExpenseGLAccountId" TEXT,
    "accumulatedDepreciationGLAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FixedAsset_entityId_idx" ON "FixedAsset"("entityId");

-- DepreciationEntry table
CREATE TABLE IF NOT EXISTS "DepreciationEntry" (
    "id" TEXT NOT NULL,
    "fixedAssetId" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DepreciationEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DepreciationEntry_fixedAssetId_periodDate_key" ON "DepreciationEntry"("fixedAssetId", "periodDate");
CREATE INDEX IF NOT EXISTS "DepreciationEntry_fixedAssetId_idx" ON "DepreciationEntry"("fixedAssetId");
CREATE INDEX IF NOT EXISTS "DepreciationEntry_journalEntryId_idx" ON "DepreciationEntry"("journalEntryId");

-- AIDecisionLog table
CREATE TABLE IF NOT EXISTS "AIDecisionLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityId" TEXT,
    "documentId" TEXT,
    "decisionType" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "confidence" INTEGER,
    "extractedData" JSONB,
    "routingResult" TEXT NOT NULL,
    "aiExplanation" TEXT,
    "consentStatus" TEXT,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIDecisionLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AIDecisionLog_tenantId_createdAt_idx" ON "AIDecisionLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "AIDecisionLog_tenantId_decisionType_createdAt_idx" ON "AIDecisionLog"("tenantId", "decisionType", "createdAt");
CREATE INDEX IF NOT EXISTS "AIDecisionLog_tenantId_routingResult_idx" ON "AIDecisionLog"("tenantId", "routingResult");
CREATE INDEX IF NOT EXISTS "AIDecisionLog_inputHash_idx" ON "AIDecisionLog"("inputHash");
CREATE INDEX IF NOT EXISTS "AIDecisionLog_documentId_idx" ON "AIDecisionLog"("documentId");

-- FKs for FixedAsset, DepreciationEntry, AIDecisionLog
ALTER TABLE "FixedAsset" ADD CONSTRAINT "FixedAsset_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepreciationEntry" ADD CONSTRAINT "DepreciationEntry_fixedAssetId_fkey"
    FOREIGN KEY ("fixedAssetId") REFERENCES "FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepreciationEntry" ADD CONSTRAINT "DepreciationEntry_journalEntryId_fkey"
    FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIDecisionLog" ADD CONSTRAINT "AIDecisionLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AIDecisionLog" ADD CONSTRAINT "AIDecisionLog_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================================
-- End baseline section
-- ==========================================================================

-- CreateEnum: Planning domain enums (ARCH-11)
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "GoalType" AS ENUM ('SAVINGS', 'REVENUE', 'EXPENSE_REDUCTION', 'DEBT_PAYOFF', 'OTHER');
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ACHIEVED', 'MISSED', 'CANCELLED');
CREATE TYPE "ForecastType" AS ENUM ('CASH_FLOW', 'REVENUE', 'EXPENSE');
CREATE TYPE "ForecastScenario" AS ENUM ('BASELINE', 'OPTIMISTIC', 'PESSIMISTIC');

-- Budget: Convert period from String to BudgetPeriod enum
ALTER TABLE "Budget" ADD COLUMN "period_new" "BudgetPeriod";

-- Migrate existing data (convert string values to enum)
UPDATE "Budget" SET "period_new" =
  CASE
    WHEN UPPER("period") = 'MONTHLY' THEN 'MONTHLY'::"BudgetPeriod"
    WHEN UPPER("period") = 'QUARTERLY' THEN 'QUARTERLY'::"BudgetPeriod"
    WHEN UPPER("period") = 'YEARLY' THEN 'YEARLY'::"BudgetPeriod"
    ELSE 'MONTHLY'::"BudgetPeriod" -- Default for any unexpected values
  END;

-- Drop old column and rename new column
ALTER TABLE "Budget" DROP COLUMN "period";
ALTER TABLE "Budget" RENAME COLUMN "period_new" TO "period";
ALTER TABLE "Budget" ALTER COLUMN "period" SET NOT NULL;

-- Goal: Convert type from String to GoalType enum
ALTER TABLE "Goal" ADD COLUMN "type_new" "GoalType";

UPDATE "Goal" SET "type_new" =
  CASE
    WHEN UPPER("type") = 'SAVINGS' THEN 'SAVINGS'::"GoalType"
    WHEN UPPER("type") = 'REVENUE' THEN 'REVENUE'::"GoalType"
    WHEN UPPER("type") = 'EXPENSE_REDUCTION' OR UPPER("type") = 'EXPENSE REDUCTION' THEN 'EXPENSE_REDUCTION'::"GoalType"
    WHEN UPPER("type") = 'DEBT_PAYOFF' OR UPPER("type") = 'DEBT PAYOFF' THEN 'DEBT_PAYOFF'::"GoalType"
    ELSE 'OTHER'::"GoalType"
  END;

ALTER TABLE "Goal" DROP COLUMN "type";
ALTER TABLE "Goal" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Goal" ALTER COLUMN "type" SET NOT NULL;

-- Goal: Convert status from String to GoalStatus enum
ALTER TABLE "Goal" ADD COLUMN "status_new" "GoalStatus";

UPDATE "Goal" SET "status_new" =
  CASE
    WHEN UPPER("status") = 'ACTIVE' THEN 'ACTIVE'::"GoalStatus"
    WHEN UPPER("status") = 'PAUSED' THEN 'PAUSED'::"GoalStatus"
    WHEN UPPER("status") = 'ACHIEVED' THEN 'ACHIEVED'::"GoalStatus"
    WHEN UPPER("status") = 'MISSED' THEN 'MISSED'::"GoalStatus"
    WHEN UPPER("status") = 'CANCELLED' THEN 'CANCELLED'::"GoalStatus"
    ELSE 'ACTIVE'::"GoalStatus" -- Default for any unexpected values
  END;

ALTER TABLE "Goal" DROP COLUMN "status";
ALTER TABLE "Goal" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Goal" ALTER COLUMN "status" SET NOT NULL;

-- Forecast: Convert type from String to ForecastType enum
ALTER TABLE "Forecast" ADD COLUMN "type_new" "ForecastType";

UPDATE "Forecast" SET "type_new" =
  CASE
    WHEN UPPER("type") = 'CASH_FLOW' OR UPPER("type") = 'CASH FLOW' THEN 'CASH_FLOW'::"ForecastType"
    WHEN UPPER("type") = 'REVENUE' THEN 'REVENUE'::"ForecastType"
    WHEN UPPER("type") = 'EXPENSE' THEN 'EXPENSE'::"ForecastType"
    ELSE 'EXPENSE'::"ForecastType"
  END;

ALTER TABLE "Forecast" DROP COLUMN "type";
ALTER TABLE "Forecast" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Forecast" ALTER COLUMN "type" SET NOT NULL;

-- Forecast: Convert scenario from String to ForecastScenario enum
ALTER TABLE "Forecast" ADD COLUMN "scenario_new" "ForecastScenario";

UPDATE "Forecast" SET "scenario_new" =
  CASE
    WHEN UPPER("scenario") = 'BASELINE' THEN 'BASELINE'::"ForecastScenario"
    WHEN UPPER("scenario") = 'OPTIMISTIC' THEN 'OPTIMISTIC'::"ForecastScenario"
    WHEN UPPER("scenario") = 'PESSIMISTIC' THEN 'PESSIMISTIC'::"ForecastScenario"
    ELSE 'BASELINE'::"ForecastScenario"
  END;

ALTER TABLE "Forecast" DROP COLUMN "scenario";
ALTER TABLE "Forecast" RENAME COLUMN "scenario_new" TO "scenario";
ALTER TABLE "Forecast" ALTER COLUMN "scenario" SET NOT NULL;

-- Add columns to Goal that were added via db push (needed for shadow DB replay)
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "glAccountId" TEXT;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Update foreign key constraints on Goal (ARCH-12)
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_accountId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_categoryId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_entityId_fkey";
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_glAccountId_fkey";

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_entityId_fkey"
  FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_glAccountId_fkey"
  FOREIGN KEY ("glAccountId") REFERENCES "GLAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
