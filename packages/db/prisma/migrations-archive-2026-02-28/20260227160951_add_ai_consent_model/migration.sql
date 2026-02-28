-- CreateTable: AIConsent (SEC-32)
-- AI consent management for GDPR Article 22 and PIPEDA 4.3 compliance
CREATE TABLE "AIConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "autoCreateBills" BOOLEAN NOT NULL DEFAULT false,
    "autoCreateInvoices" BOOLEAN NOT NULL DEFAULT false,
    "autoMatchTransactions" BOOLEAN NOT NULL DEFAULT false,
    "autoCategorize" BOOLEAN NOT NULL DEFAULT false,
    "useCorrectionsForLearning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIConsent_userId_key" ON "AIConsent"("userId");

-- CreateIndex
CREATE INDEX "AIConsent_userId_idx" ON "AIConsent"("userId");

-- CreateIndex
CREATE INDEX "AIConsent_tenantId_idx" ON "AIConsent"("tenantId");

-- CreateIndex
CREATE INDEX "AIConsent_userId_tenantId_idx" ON "AIConsent"("userId", "tenantId");

-- AddForeignKey
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
