-- Baseline migration: Captures all schema changes applied via `db push` that
-- were not recorded in migration files. This reconciles the migration history
-- with the actual database state.
--
-- Changes captured here were applied during Phase 2-5 development via db push.
-- This migration is marked as "already applied" on the live DB.

-- ============================================================
-- ENUMS
-- ============================================================

-- OnboardingStatus enum
CREATE TYPE "OnboardingStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED');

-- ============================================================
-- NEW TABLES
-- ============================================================

-- OnboardingProgress table
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skippedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "basicInfoComplete" BOOLEAN NOT NULL DEFAULT false,
    "entitySetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "businessDetailsComplete" BOOLEAN NOT NULL DEFAULT false,
    "bankConnectionComplete" BOOLEAN NOT NULL DEFAULT false,
    "goalsSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "lastNudgedAt" TIMESTAMP(3),
    "dashboardCardDismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingProgress_tenantId_key" ON "OnboardingProgress"("tenantId");
CREATE INDEX "OnboardingProgress_tenantId_idx" ON "OnboardingProgress"("tenantId");

ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- ALTER TABLE: Tenant (onboarding fields)
-- ============================================================

ALTER TABLE "Tenant" ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NEW';
ALTER TABLE "Tenant" ADD COLUMN "onboardingStep" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "onboardingData" JSONB;
ALTER TABLE "Tenant" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- ============================================================
-- ALTER TABLE: User (auth/preference fields)
-- ============================================================

ALTER TABLE "User" ADD COLUMN "clerkUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT DEFAULT 'America/Toronto';

CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
CREATE INDEX "User_clerkUserId_idx" ON "User"("clerkUserId");

-- ============================================================
-- ALTER TABLE: Entity (business detail fields)
-- ============================================================

ALTER TABLE "Entity" ADD COLUMN "address" TEXT;
ALTER TABLE "Entity" ADD COLUMN "businessSize" TEXT;
ALTER TABLE "Entity" ADD COLUMN "city" TEXT;
ALTER TABLE "Entity" ADD COLUMN "coaTemplateUsed" TEXT;
ALTER TABLE "Entity" ADD COLUMN "fiscalYearStart" INTEGER;
ALTER TABLE "Entity" ADD COLUMN "industry" TEXT;
ALTER TABLE "Entity" ADD COLUMN "industryCode" TEXT;
ALTER TABLE "Entity" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Entity" ADD COLUMN "setupCompletedAt" TIMESTAMP(3);
ALTER TABLE "Entity" ADD COLUMN "state" TEXT;

-- ============================================================
-- ALTER TABLE: AuditLog (integrity chain fields)
-- ============================================================

ALTER TABLE "AuditLog" ADD COLUMN "integrityHash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "previousHash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "sequenceNumber" INTEGER;

CREATE INDEX "AuditLog_tenantId_sequenceNumber_idx" ON "AuditLog"("tenantId", "sequenceNumber");

-- ============================================================
-- ALTER TABLE: Category (tenant scoping)
-- ============================================================

ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT NOT NULL;

ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Category_tenantId_idx" ON "Category"("tenantId");
CREATE INDEX "Category_tenantId_type_idx" ON "Category"("tenantId", "type");
CREATE INDEX "Category_tenantId_isActive_idx" ON "Category"("tenantId", "isActive");
CREATE INDEX "Category_tenantId_deletedAt_idx" ON "Category"("tenantId", "deletedAt");

-- ============================================================
-- INDEX CHANGES: Performance & unique constraints
-- ============================================================

-- CreditNote: Drop old entityId-only index (replacement composite index
-- CreditNote_entityId_deletedAt_idx is created in 20260220164700_add_deleted_at_and_perf_indexes)
DROP INDEX IF EXISTS "CreditNote_entityId_idx";

-- Invoice: Unique invoice number per entity
CREATE UNIQUE INDEX "Invoice_entityId_invoiceNumber_key" ON "Invoice"("entityId", "invoiceNumber");

-- Bill: Unique bill number per entity
CREATE UNIQUE INDEX "Bill_entityId_billNumber_key" ON "Bill"("entityId", "billNumber");

-- JournalEntry: Composite index for report queries
CREATE INDEX "JournalEntry_entityId_status_deletedAt_date_idx" ON "JournalEntry"("entityId", "status", "deletedAt", "date");

-- JournalLine: Composite index for report aggregations
CREATE INDEX "JournalLine_glAccountId_deletedAt_idx" ON "JournalLine"("glAccountId", "deletedAt");

-- BankFeedTransaction: Composite index for date-ordered queries
CREATE INDEX "BankFeedTransaction_accountId_date_id_idx" ON "BankFeedTransaction"("accountId", "date", "id");

-- Transaction: Composite index for date-ordered + import batch queries
CREATE INDEX "Transaction_accountId_date_id_idx" ON "Transaction"("accountId", "date", "id");
CREATE INDEX "Transaction_importBatchId_idx" ON "Transaction"("importBatchId");
