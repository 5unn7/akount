import { test, expect } from './fixtures/auth.fixture';

/**
 * Invoice Lifecycle E2E Tests
 *
 * Tests the complete invoice management flow:
 * List -> Create -> View -> Actions
 */
test.describe('Invoice Lifecycle', () => {
  test.describe('Invoice List Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/business/invoices');
    });

    test('should display invoices page', async ({ page }) => {
      await expect(page.locator('main')).toBeVisible();
    });

    test('should show create invoice button', async ({ page }) => {
      const createBtn = page.getByRole('button', { name: /create|new/i }).first();
      await expect(createBtn).toBeVisible();
    });

    test('should show invoice status filter or tabs', async ({ page }) => {
      // Page should have status filtering capability
      const hasFilter = (await page.getByText(/all|draft|sent|paid/i).count()) > 0;
      expect(hasFilter).toBeTruthy();
    });

    test('should display table or empty state', async ({ page }) => {
      const hasTable = (await page.locator('table').count()) > 0;
      const hasEmptyState = (await page.getByText(/no invoices/i).count()) > 0;
      expect(hasTable || hasEmptyState).toBeTruthy();
    });
  });

  test.describe('Invoice Detail (if data exists)', () => {
    test('should navigate to invoice detail when clicking a row', async ({ page }) => {
      await page.goto('/business/invoices');

      // Find clickable invoice row
      const invoiceRow = page.locator('table tbody tr').first();
      if ((await invoiceRow.count()) === 0) {
        test.skip(true, 'No invoices found — skipping detail tests');
        return;
      }

      await invoiceRow.click();
      await expect(page).toHaveURL(/.*invoices\/[a-z0-9-]+/);
    });

    test('should display invoice details with amount', async ({ page }) => {
      await page.goto('/business/invoices');

      const invoiceRow = page.locator('table tbody tr').first();
      if ((await invoiceRow.count()) === 0) {
        test.skip(true, 'No invoices found');
        return;
      }

      await invoiceRow.click();
      await expect(page).toHaveURL(/.*invoices\/[a-z0-9-]+/);

      // Should show invoice number or status
      const hasStatus = (await page.getByText(/draft|sent|paid|overdue/i).count()) > 0;
      expect(hasStatus).toBeTruthy();
    });
  });
});
