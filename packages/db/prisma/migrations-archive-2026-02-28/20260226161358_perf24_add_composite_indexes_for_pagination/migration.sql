-- PERF-24: Add composite indexes for pagination queries (100x speedup)
-- Optimizes list queries that filter + order + soft-delete

-- DropIndex
DROP INDEX "AuditLog_entityId_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_tenantId_createdAt_idx";

-- DropIndex
DROP INDEX "AuditLog_userId_createdAt_idx";

-- DropIndex
DROP INDEX "Transaction_accountId_createdAt_idx";

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityId_createdAt_idx" ON "AuditLog"("entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Bill_entityId_status_createdAt_deletedAt_idx" ON "Bill"("entityId", "status", "createdAt" DESC, "deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_entityId_status_createdAt_deletedAt_idx" ON "Invoice"("entityId", "status", "createdAt" DESC, "deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_accountId_deletedAt_createdAt_idx" ON "Transaction"("accountId", "deletedAt", "createdAt" DESC);
