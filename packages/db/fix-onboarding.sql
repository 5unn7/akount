-- Find your user's tenant and update onboarding status
UPDATE "Tenant" 
SET "onboardingStatus" = 'COMPLETED',
    "onboardingCompletedAt" = NOW()
WHERE id IN (
  SELECT "tenantId" 
  FROM "TenantUser" tu
  JOIN "User" u ON u.id = tu."userId"
  WHERE u."clerkUserId" = 'user_39gdwiagjpTdUpt7UPB93dEZo3W'
);
