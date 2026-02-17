-- Phase 5: Add composite indexes for report query performance

-- JournalEntry covering index for report WHERE clause
-- Improves queries filtering by entityId + status + deletedAt + date range
CREATE INDEX "JournalEntry_entityId_status_deletedAt_date_idx"
ON "JournalEntry"("entityId", "status", "deletedAt", "date");

-- JournalLine index for GROUP BY with soft delete filter
-- Improves aggregation queries grouping by glAccountId with deletedAt filter
CREATE INDEX "JournalLine_glAccountId_deletedAt_idx"
ON "JournalLine"("glAccountId", "deletedAt");
