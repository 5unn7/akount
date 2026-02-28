-- Phase 3: Accounting Engine Schema Migration
-- Adds VOIDED status, multi-currency journal lines, bank-to-GL mapping,
-- Transaction→JournalEntry relation, and TransactionSplit GL mapping.

-- AlterEnum: Add VOIDED to JournalEntryStatus
ALTER TYPE "JournalEntryStatus" ADD VALUE 'VOIDED';

-- AlterTable: Add entryNumber and updatedBy to JournalEntry
ALTER TABLE "JournalEntry" ADD COLUMN "entryNumber" TEXT;
ALTER TABLE "JournalEntry" ADD COLUMN "updatedBy" TEXT;

-- AlterTable: Add multi-currency fields to JournalLine
ALTER TABLE "JournalLine" ADD COLUMN "currency" TEXT;
ALTER TABLE "JournalLine" ADD COLUMN "exchangeRate" DOUBLE PRECISION;
ALTER TABLE "JournalLine" ADD COLUMN "baseCurrencyDebit" INTEGER;
ALTER TABLE "JournalLine" ADD COLUMN "baseCurrencyCredit" INTEGER;

-- AlterTable: Add glAccountId to Account (bank-to-GL mapping)
ALTER TABLE "Account" ADD COLUMN "glAccountId" TEXT;

-- AlterTable: Add glAccountId to TransactionSplit
ALTER TABLE "TransactionSplit" ADD COLUMN "glAccountId" TEXT;

-- CreateIndex: JournalEntry entryNumber per entity
CREATE INDEX "JournalEntry_entityId_entryNumber_idx" ON "JournalEntry"("entityId", "entryNumber");

-- AddForeignKey: Transaction → JournalEntry
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Account → GLAccount (bank-to-GL mapping)
ALTER TABLE "Account" ADD CONSTRAINT "Account_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GLAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: TransactionSplit → GLAccount
ALTER TABLE "TransactionSplit" ADD CONSTRAINT "TransactionSplit_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "GLAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Unique partial index to prevent double-posting race conditions
-- Only one Transaction can be linked to a given JournalEntry
CREATE UNIQUE INDEX "Transaction_journalEntryId_unique" ON "Transaction" ("journalEntryId") WHERE "journalEntryId" IS NOT NULL;
