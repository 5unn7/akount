-- Combined migration: Add deletedAt columns + performance indexes
-- Squashed from 3 migrations that had incorrect ordering:
--   20260220164700_add_perf_21_22_indexes (referenced deletedAt before it existed)
--   20260220170000_add_deleted_at_columns (added deletedAt columns)
--   20260220170100_add_perf_18_19_20_indexes (referenced deletedAt before it existed)
--
-- Fix: Columns MUST be added before indexes that reference them.

-- ============================================================
-- PART 1: Add deletedAt columns to financial models (soft delete)
-- Invariant #4: Financial records use soft delete (deletedAt field, never hard delete)
-- ============================================================

-- JournalEntry and JournalLine
ALTER TABLE "JournalEntry" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "JournalLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Invoicing domain
ALTER TABLE "Client" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "InvoiceLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Vendors domain
ALTER TABLE "Vendor" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Bill" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "BillLine" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Payments
ALTER TABLE "Payment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "CreditNote" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Banking domain
ALTER TABLE "Account" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "BankFeedTransaction" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Transaction" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Categories
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- ============================================================
-- PART 2: Soft delete indexes (WHERE deletedAt IS NULL patterns)
-- ============================================================

CREATE INDEX "JournalEntry_entityId_deletedAt_idx" ON "JournalEntry"("entityId", "deletedAt");
CREATE INDEX "JournalLine_journalEntryId_deletedAt_idx" ON "JournalLine"("journalEntryId", "deletedAt");
CREATE INDEX "Client_entityId_deletedAt_idx" ON "Client"("entityId", "deletedAt");
CREATE INDEX "Invoice_entityId_deletedAt_idx" ON "Invoice"("entityId", "deletedAt");
CREATE INDEX "InvoiceLine_invoiceId_deletedAt_idx" ON "InvoiceLine"("invoiceId", "deletedAt");
CREATE INDEX "Vendor_entityId_deletedAt_idx" ON "Vendor"("entityId", "deletedAt");
CREATE INDEX "Bill_entityId_deletedAt_idx" ON "Bill"("entityId", "deletedAt");
CREATE INDEX "BillLine_billId_deletedAt_idx" ON "BillLine"("billId", "deletedAt");
CREATE INDEX "Payment_entityId_deletedAt_idx" ON "Payment"("entityId", "deletedAt");
CREATE INDEX "CreditNote_entityId_deletedAt_idx" ON "CreditNote"("entityId", "deletedAt");
CREATE INDEX "Account_entityId_deletedAt_idx" ON "Account"("entityId", "deletedAt");
CREATE INDEX "BankFeedTransaction_accountId_deletedAt_idx" ON "BankFeedTransaction"("accountId", "deletedAt");
CREATE INDEX "Transaction_accountId_deletedAt_idx" ON "Transaction"("accountId", "deletedAt");

-- ============================================================
-- PART 3: Performance composite indexes (PERF-21, PERF-22)
-- ============================================================

-- PERF-21: JournalLine composite index for GL account filtering
CREATE INDEX "JournalLine_glAccountId_journalEntryId_deletedAt_idx" ON "JournalLine"("glAccountId", "journalEntryId", "deletedAt");

-- PERF-22: Payment composite indexes for client/vendor history filtering
CREATE INDEX "Payment_clientId_date_deletedAt_idx" ON "Payment"("clientId", "date", "deletedAt");
CREATE INDEX "Payment_vendorId_date_deletedAt_idx" ON "Payment"("vendorId", "date", "deletedAt");

-- ============================================================
-- PART 4: Performance composite indexes (PERF-18, PERF-19, PERF-20)
-- ============================================================

-- PERF-18: Invoice AR aging composite index
CREATE INDEX IF NOT EXISTS "Invoice_entityId_status_dueDate_deletedAt_idx" ON "Invoice"("entityId", "status", "dueDate", "deletedAt");

-- PERF-19: Transaction date range with category filter composite index
CREATE INDEX "Transaction_accountId_categoryId_date_deletedAt_idx" ON "Transaction"("accountId", "categoryId", "date", "deletedAt");

-- PERF-20: Bill AP aging composite index
CREATE INDEX IF NOT EXISTS "Bill_entityId_status_dueDate_deletedAt_idx" ON "Bill"("entityId", "status", "dueDate", "deletedAt");
