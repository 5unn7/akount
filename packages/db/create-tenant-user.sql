-- First, let's see what we have
SELECT 
  u.id as user_id,
  u.email,
  u."clerkUserId",
  COUNT(tu.id) as tenant_count
FROM "User" u
LEFT JOIN "TenantUser" tu ON tu."userId" = u.id
WHERE u."clerkUserId" = 'user_39gdwiagjpTdUpt7UPB93dEZo3W'
GROUP BY u.id, u.email, u."clerkUserId";
