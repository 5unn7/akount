-- CreateEnum
CREATE TYPE "AIActionType" AS ENUM ('CATEGORIZATION', 'JE_DRAFT', 'RULE_SUGGESTION', 'ALERT');

-- CreateEnum
CREATE TYPE "AIActionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AIActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "AIAction" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" "AIActionType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AIActionStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" INTEGER,
    "priority" "AIActionPriority" NOT NULL DEFAULT 'MEDIUM',
    "payload" JSONB NOT NULL,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "metadata" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAction_entityId_status_idx" ON "AIAction"("entityId", "status");

-- CreateIndex
CREATE INDEX "AIAction_entityId_type_status_idx" ON "AIAction"("entityId", "type", "status");

-- CreateIndex
CREATE INDEX "AIAction_entityId_createdAt_idx" ON "AIAction"("entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AIAction_status_expiresAt_idx" ON "AIAction"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
