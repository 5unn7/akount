-- DEV-185: Add defaultGLAccountId FK on Category for AI categorization GL mapping
-- Note: Cross-scope FK (Category is tenant-scoped, GLAccount is entity-scoped).
-- Runtime validation ensures the GLAccount belongs to an entity within the same tenant.
ALTER TABLE "Category" ADD COLUMN "defaultGLAccountId" TEXT;

-- Index for FK lookups
CREATE INDEX "Category_defaultGLAccountId_idx" ON "Category"("defaultGLAccountId");

-- Foreign key constraint
ALTER TABLE "Category" ADD CONSTRAINT "Category_defaultGLAccountId_fkey" FOREIGN KEY ("defaultGLAccountId") REFERENCES "GLAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DEV-186: Add AI_SUGGESTION to JournalEntrySourceType enum
ALTER TYPE "JournalEntrySourceType" ADD VALUE 'AI_SUGGESTION';
