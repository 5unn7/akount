import { test, expect } from './fixtures/auth.fixture';

/**
 * E2E Tests for Account Management
 *
 * Tests the banking accounts list and detail pages.
 * Auth handled by auth.setup.ts via storageState.
 * Entity cookie set automatically by auth.fixture.ts.
 */
test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/banking/accounts');
  });

  test('should display accounts list page', async ({ page }) => {
    await expect(page).toHaveURL(/.*accounts/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate to account detail page when clicking a card', async ({ page }) => {
    // Find the first account card
    const accountCard = page.locator('[role="button"]').first();

    // Skip if no accounts exist
    if ((await accountCard.count()) === 0) {
      test.skip(true, 'No accounts found — skipping navigation test');
      return;
    }

    // Click the account card
    await accountCard.click();

    // Wait for navigation to detail page
    await expect(page).toHaveURL(/.*accounts\/[a-z0-9-]+/);
  });

  test('should display account details and balance', async ({ page }) => {
    const accountCard = page.locator('[role="button"]').first();

    if ((await accountCard.count()) === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await expect(page).toHaveURL(/.*accounts\/[a-z0-9-]+/);

    // Check for balance display
    await expect(page.getByText(/current balance/i)).toBeVisible();

    // Check for currency symbol in balance
    await expect(page.locator('text=/[$€£¥CAD]/')).toBeVisible();
  });

  test('should display transactions table or empty state', async ({ page }) => {
    const accountCard = page.locator('[role="button"]').first();

    if ((await accountCard.count()) === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await expect(page).toHaveURL(/.*accounts\/[a-z0-9-]+/);

    // Either transactions table or empty state should be visible
    const hasTable = (await page.locator('table').count()) > 0;
    const hasEmptyState = (await page.getByText(/no transactions/i).count()) > 0;

    expect(hasTable || hasEmptyState).toBeTruthy();

    if (hasTable) {
      await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
      await expect(
        page.getByRole('columnheader', { name: /description/i }),
      ).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /amount/i })).toBeVisible();
    }
  });

  test('should navigate back to accounts list', async ({ page }) => {
    const accountCard = page.locator('[role="button"]').first();

    if ((await accountCard.count()) === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await expect(page).toHaveURL(/.*accounts\/[a-z0-9-]+/);

    // Click back button
    const backButton = page.getByRole('link', { name: /back to accounts/i });
    if ((await backButton.count()) > 0) {
      await backButton.click();
      await expect(page).toHaveURL(/.*accounts$/);
    } else {
      // Fallback: use browser back
      await page.goBack();
      await expect(page).toHaveURL(/.*accounts/);
    }
  });

  test('should show error page for invalid account ID', async ({ page }) => {
    await page.goto('/banking/accounts/invalid-account-id-12345');

    // Check for error message or "not found" text
    await expect(
      page.getByText(/not found|error|something went wrong/i),
    ).toBeVisible();
  });
});
