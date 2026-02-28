-- ARCH-15: Change AIConsent CASCADE delete to Restrict
-- Preserves consent audit trail when user/tenant deleted (GDPR requirement)
-- Prevents automatic destruction of proof of lawful processing

-- AlterTable: Update foreign key constraints
ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_userId_fkey";
ALTER TABLE "AIConsent" DROP CONSTRAINT "AIConsent_tenantId_fkey";

-- AddForeignKey: Re-create with Restrict instead of Cascade
ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AIConsent" ADD CONSTRAINT "AIConsent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
