import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Link Dev User to Tenant
 *
 * This script creates the dev@akount.ai user and links them to the Demo Company tenant.
 * Run this after creating the user in Clerk dashboard.
 */
async function main() {
  console.log('🔗 Linking dev user to tenant...');

  // Your Clerk user details (from Clerk dashboard)
  const CLERK_USER_ID = 'user_39RyK2nkUtJtfG4yzzoqLoen3gV';
  const EMAIL = 'dev@akount.ai';
  const NAME = 'Dev User';

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: 'tenant_demo' },
  });

  if (!tenant) {
    console.error('❌ Tenant not found! Run seed script first: npm run db:seed');
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}`);

  // Create or update user
  const user = await prisma.user.upsert({
    where: { clerkUserId: CLERK_USER_ID },
    update: {
      email: EMAIL,
      name: NAME,
    },
    create: {
      id: `user_dev_${Date.now()}`,
      clerkUserId: CLERK_USER_ID,
      email: EMAIL,
      name: NAME,
    },
  });

  console.log(`✅ User created/updated: ${user.email}`);

  // Link user to tenant
  const tenantUser = await prisma.tenantUser.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: user.id,
      },
    },
    update: {
      role: 'OWNER',
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'OWNER',
    },
  });

  console.log(`✅ User linked to tenant with role: ${tenantUser.role}`);

  console.log('\n🎉 Success! You can now sign in with dev@akount.ai');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Clerk User ID: ${CLERK_USER_ID}`);
  console.log(`🏢 Tenant: ${tenant.name} (${tenant.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
