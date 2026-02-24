import { test, expect } from './fixtures/auth.fixture';

test.describe('Financial Reports', () => {
  test.describe('Reports Hub', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounting/reports');
    });

    test('should display the reports hub heading', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'Financial Reports' }),
      ).toBeVisible();
      await expect(
        page.getByText('Generate comprehensive financial statements and management reports'),
      ).toBeVisible();
    });

    test('should display all 7 report cards', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Profit & Loss' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Balance Sheet' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Cash Flow' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Trial Balance' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'General Ledger' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Spending by Category' }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Revenue by Client' }),
      ).toBeVisible();
    });

    test('should navigate to Profit & Loss report', async ({ page }) => {
      await page.getByRole('heading', { name: 'Profit & Loss' }).click();
      await expect(page).toHaveURL(/.*reports\/profit-loss/);
    });

    test('should navigate to Balance Sheet report', async ({ page }) => {
      await page.getByRole('heading', { name: 'Balance Sheet' }).click();
      await expect(page).toHaveURL(/.*reports\/balance-sheet/);
    });

    test('should navigate to Trial Balance report', async ({ page }) => {
      await page.getByRole('heading', { name: 'Trial Balance' }).click();
      await expect(page).toHaveURL(/.*reports\/trial-balance/);
    });
  });

  test.describe('Profit & Loss Report', () => {
    test('should display the P&L report page', async ({ page }) => {
      await page.goto('/accounting/reports/profit-loss');
      await expect(
        page.getByRole('heading', { name: 'Profit & Loss Statement' }),
      ).toBeVisible();
      await expect(
        page.getByText('Income statement showing revenue, expenses, and net income'),
      ).toBeVisible();
    });

    test('should show date range controls', async ({ page }) => {
      await page.goto('/accounting/reports/profit-loss');
      await expect(page.getByText('Start Date')).toBeVisible();
      await expect(page.getByText('End Date')).toBeVisible();
    });

    test('should have a Generate Report button', async ({ page }) => {
      await page.goto('/accounting/reports/profit-loss');
      await expect(
        page.getByRole('button', { name: /Generate Report/i }),
      ).toBeVisible();
    });
  });

  test.describe('Balance Sheet Report', () => {
    test('should display the Balance Sheet page', async ({ page }) => {
      await page.goto('/accounting/reports/balance-sheet');
      await expect(
        page.getByRole('heading', { name: 'Balance Sheet' }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Financial position snapshot showing assets, liabilities, and equity',
        ),
      ).toBeVisible();
    });

    test('should show As of Date control', async ({ page }) => {
      await page.goto('/accounting/reports/balance-sheet');
      await expect(page.getByText('As of Date')).toBeVisible();
    });

    test('should have a Generate Report button', async ({ page }) => {
      await page.goto('/accounting/reports/balance-sheet');
      await expect(
        page.getByRole('button', { name: /Generate Report/i }),
      ).toBeVisible();
    });
  });

  test.describe('Trial Balance Report', () => {
    test('should display the Trial Balance page', async ({ page }) => {
      await page.goto('/accounting/reports/trial-balance');
      await expect(
        page.getByRole('heading', { name: 'Trial Balance' }),
      ).toBeVisible();
      await expect(
        page.getByText(
          'Verify that total debits equal total credits across all accounts',
        ),
      ).toBeVisible();
    });

    test('should require entity selection', async ({ page }) => {
      await page.goto('/accounting/reports/trial-balance');
      // Entity selector should be present
      await expect(page.getByText(/Entity/i).first()).toBeVisible();
    });

    test('should have a Generate Report button', async ({ page }) => {
      await page.goto('/accounting/reports/trial-balance');
      await expect(
        page.getByRole('button', { name: /Generate Report/i }),
      ).toBeVisible();
    });
  });

  test.describe('Report Navigation Flow', () => {
    test('should navigate hub → P&L → back to hub', async ({ page }) => {
      // Start at reports hub
      await page.goto('/accounting/reports');
      await expect(
        page.getByRole('heading', { name: 'Financial Reports' }),
      ).toBeVisible();

      // Navigate to P&L
      await page.getByRole('heading', { name: 'Profit & Loss' }).click();
      await expect(page).toHaveURL(/.*reports\/profit-loss/);
      await expect(
        page.getByRole('heading', { name: 'Profit & Loss Statement' }),
      ).toBeVisible();

      // Navigate back to hub
      await page.goBack();
      await expect(page).toHaveURL(/.*\/reports$/);
    });
  });
});
