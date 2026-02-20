-- PERF-18, PERF-19, PERF-20: Add composite indexes for critical query paths
-- Source: Weekly audit 2026-02-20 (Critical priority tasks)

-- PERF-18: Invoice AR aging composite index (already exists from PERF-5 - verify)
-- Speeds up AR aging queries: SELECT * FROM Invoice WHERE entityId = X AND status IN (...) AND dueDate < Y AND deletedAt IS NULL
CREATE INDEX IF NOT EXISTS "Invoice_entityId_status_dueDate_deletedAt_idx" ON "Invoice"("entityId", "status", "dueDate", "deletedAt");

-- PERF-19: Transaction date range with category filter composite index
-- Speeds up banking transaction list queries with category filter and date range
-- SELECT * FROM Transaction WHERE accountId = X AND categoryId = Y AND date >= Z AND deletedAt IS NULL
CREATE INDEX "Transaction_accountId_categoryId_date_deletedAt_idx" ON "Transaction"("accountId", "categoryId", "date", "deletedAt");

-- PERF-20: Bill AP aging composite index (already exists from PERF-5 - verify)
-- Speeds up AP aging queries: SELECT * FROM Bill WHERE entityId = X AND status IN (...) AND dueDate < Y AND deletedAt IS NULL
CREATE INDEX IF NOT EXISTS "Bill_entityId_status_dueDate_deletedAt_idx" ON "Bill"("entityId", "status", "dueDate", "deletedAt");
