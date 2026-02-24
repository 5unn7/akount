import { clerk } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STORAGE_STATE = path.join(__dirname, '../playwright/.clerk/user.json');
const TEST_DATA_PATH = path.join(__dirname, '../playwright/.clerk/test-data.json');
const TEST_EMAIL = 'dev+clerk_test@akount.ai';

setup('authenticate and resolve entities', async ({ page }) => {
  // 1. Navigate to public page so Clerk loads
  await page.goto('/');

  // 2. Sign in via Clerk ticket strategy (uses CLERK_SECRET_KEY)
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });

  // 3. Navigate to a protected page to verify auth works
  await page.goto('/overview');
  await page.waitForURL(/\/(overview|onboarding)/);

  // 4. Resolve entity IDs from the API (needed for entity cookie in tests)
  const testData = await page.evaluate(async () => {
    const clerkInstance = window.Clerk;
    const token = await clerkInstance?.session?.getToken();
    if (!token) return { entities: [] };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/system/entities`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return { entities: [] };

    const data = await res.json();
    return {
      entities: data.entities.map(
        (e: { id: string; name: string; functionalCurrency: string }) => ({
          id: e.id,
          name: e.name,
          currency: e.functionalCurrency,
        }),
      ),
    };
  });

  // 5. Save entity data for test specs
  const clerkDir = path.dirname(TEST_DATA_PATH);
  if (!fs.existsSync(clerkDir)) {
    fs.mkdirSync(clerkDir, { recursive: true });
  }
  fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(testData, null, 2));

  // 6. Save authenticated storage state
  await page.context().storageState({ path: STORAGE_STATE });
});
