-- Sprint 0 Task 0.1: Schema migrations for New User Journey
-- Source: docs/plans/2026-02-20-new-user-journey-ux-overhaul.md
--
-- 1. Add OPENING_BALANCE to JournalEntrySourceType enum (for opening balance JEs)
-- 2. Add deletedAt to BankConnection (soft delete support — Invariant #4)
-- 3. Add bankConnectionId to Account (links Flinks-imported accounts to their connection)

-- AlterEnum
ALTER TYPE "JournalEntrySourceType" ADD VALUE 'OPENING_BALANCE';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "bankConnectionId" TEXT;

-- AlterTable
ALTER TABLE "BankConnection" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Account_bankConnectionId_idx" ON "Account"("bankConnectionId");

-- CreateIndex
CREATE INDEX "BankConnection_entityId_deletedAt_idx" ON "BankConnection"("entityId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_bankConnectionId_fkey" FOREIGN KEY ("bankConnectionId") REFERENCES "BankConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
