import { test, expect } from './fixtures/auth.fixture';

/**
 * Transfer E2E Tests
 *
 * Tests the banking transfers flow.
 */
test.describe('Banking Transfers', () => {
  test.describe('Transfer List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/banking/transfers');
    });

    test('should display transfers page', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible();
    });

    test('should show create transfer button', async ({ page }) => {
      const createBtn = page
        .getByRole('button', { name: /create|new|transfer/i })
        .first();
      await expect(createBtn).toBeVisible();
    });

    test('should display table or empty state', async ({ page }) => {
      const hasTable = (await page.locator('table').count()) > 0;
      const hasEmptyState = (await page.getByText(/no transfers/i).count()) > 0;
      expect(hasTable || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Transfer Detail (if data exists)', () => {
    test('should navigate to transfer detail', async ({ page }) => {
      await page.goto('/banking/transfers');

      const transferRow = page.locator('table tbody tr').first();
      if ((await transferRow.count()) === 0) {
        test.skip(true, 'No transfers found — skipping detail tests');
        return;
      }

      await transferRow.click();
      await expect(page).toHaveURL(/.*transfers\/[a-z0-9-]+/);
    });

    test('should show transfer amounts and accounts', async ({ page }) => {
      await page.goto('/banking/transfers');

      const transferRow = page.locator('table tbody tr').first();
      if ((await transferRow.count()) === 0) {
        test.skip(true, 'No transfers found');
        return;
      }

      await transferRow.click();
      await expect(page).toHaveURL(/.*transfers\/[a-z0-9-]+/);

      // Should show amount with currency symbol
      await expect(page.locator('text=/[$€£¥CAD]/')).toBeVisible();
    });
  });
});
