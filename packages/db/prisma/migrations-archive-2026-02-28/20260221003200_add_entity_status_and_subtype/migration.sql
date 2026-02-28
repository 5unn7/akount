-- Entity Management Hub: Add status, entitySubType, registrationDate fields
-- Safe migration: status defaults to ACTIVE (no data migration needed), other fields are nullable

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "entitySubType" TEXT,
ADD COLUMN     "registrationDate" TIMESTAMP(3),
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Entity_tenantId_status_idx" ON "Entity"("tenantId", "status");
