-- PERF-27: Optimize AI worker Client/Vendor name lookups
-- Prevents N+1 queries during bill/invoice scanning (10x performance improvement)
-- Workers use findFirst({ where: { entityId, name, deletedAt: null }})
-- This compound index supports that exact query pattern

-- CreateIndex: Client name lookup optimization
CREATE INDEX "Client_entityId_name_deletedAt_idx" ON "Client"("entityId", "name", "deletedAt");

-- CreateIndex: Vendor name lookup optimization
CREATE INDEX "Vendor_entityId_name_deletedAt_idx" ON "Vendor"("entityId", "name", "deletedAt");
