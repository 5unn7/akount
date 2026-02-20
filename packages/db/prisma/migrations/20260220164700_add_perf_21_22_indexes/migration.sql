-- PERF-21 & PERF-22: Add composite indexes for GL account filtering and payment history queries
-- Source: Weekly audit 2026-02-20

-- PERF-21: JournalLine composite index for GL account filtering
-- Speeds up GL ledger queries by account (SELECT * FROM JournalLine WHERE glAccountId = X AND deletedAt IS NULL)
CREATE INDEX "JournalLine_glAccountId_journalEntryId_deletedAt_idx" ON "JournalLine"("glAccountId", "journalEntryId", "deletedAt");

-- PERF-22: Payment composite indexes for client/vendor history filtering
-- Speeds up payment history queries (SELECT * FROM Payment WHERE clientId = X AND date >= Y AND deletedAt IS NULL)
CREATE INDEX "Payment_clientId_date_deletedAt_idx" ON "Payment"("clientId", "date", "deletedAt");
CREATE INDEX "Payment_vendorId_date_deletedAt_idx" ON "Payment"("vendorId", "date", "deletedAt");
