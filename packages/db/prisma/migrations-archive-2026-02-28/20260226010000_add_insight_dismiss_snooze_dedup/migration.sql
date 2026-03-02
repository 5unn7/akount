-- AlterTable
ALTER TABLE "Insight" ADD COLUMN "dismissedAt" TIMESTAMP(3),
ADD COLUMN "dismissedBy" TEXT,
ADD COLUMN "snoozedUntil" TIMESTAMP(3),
ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Insight_entityId_triggerId_key" ON "Insight"("entityId", "triggerId");
