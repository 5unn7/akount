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
