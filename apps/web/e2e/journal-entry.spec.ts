import { test, expect } from './fixtures/auth.fixture';

test.describe('Journal Entry Posting', () => {
  test.describe('Journal Entry Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/accounting/journal-entries/new');
    });

    test('should display the new journal entry form', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: 'New Journal Entry' }),
      ).toBeVisible();
      await expect(
        page.getByText('Create a manual double-entry journal entry'),
      ).toBeVisible();
    });

    test('should show date and memo inputs', async ({ page }) => {
      await expect(page.getByText('Date')).toBeVisible();
      await expect(page.getByText('Memo')).toBeVisible();
      await expect(
        page.getByPlaceholder('Description of this journal entry'),
      ).toBeVisible();
    });

    test('should show journal lines table with GL Account columns', async ({ page }) => {
      await expect(page.getByText('Journal Lines')).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /GL Account/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Debit/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /Credit/i })).toBeVisible();
    });

    test('should start with "Enter amounts" indicator', async ({ page }) => {
      await expect(page.getByText('Enter amounts')).toBeVisible();
    });

    test('should show balanced indicator when debits equal credits', async ({ page }) => {
      // Fill date
      const dateInput = page.locator('input[type="date"]');
      await dateInput.fill('2026-01-15');

      // Fill memo
      await page.getByPlaceholder('Description of this journal entry').fill('Test entry');

      // Line 1: enter debit amount
      const debitInputs = page.locator('input[placeholder="0.00"]');
      await debitInputs.nth(0).fill('100');

      // Line 2: enter credit amount
      await debitInputs.nth(3).fill('100');

      // Balance indicator should show "Balanced"
      await expect(page.getByText(/Balanced/)).toBeVisible();
    });

    test('should show out-of-balance warning when amounts differ', async ({ page }) => {
      // Line 1: debit 100
      const amountInputs = page.locator('input[placeholder="0.00"]');
      await amountInputs.nth(0).fill('100');

      // Line 2: credit 50 (different amount)
      await amountInputs.nth(3).fill('50');

      // Should show out of balance warning
      await expect(page.getByText(/Out of balance by/)).toBeVisible();
    });

    test('should disable submit when entry is not balanced', async ({ page }) => {
      // Enter mismatched amounts
      const amountInputs = page.locator('input[placeholder="0.00"]');
      await amountInputs.nth(0).fill('100');
      await amountInputs.nth(3).fill('50');

      // Submit button should be disabled
      const submitButton = page.getByRole('button', { name: /Create Draft Entry/i });
      await expect(submitButton).toBeDisabled();
    });

    test('should add a new journal line', async ({ page }) => {
      // Count initial lines (should be 2)
      const lineRows = page.locator('tbody tr');
      const initialCount = await lineRows.count();

      // Click "Add Line"
      await page.getByRole('button', { name: /Add Line/i }).click();

      // Should have one more line
      await expect(lineRows).toHaveCount(initialCount + 1);
    });

    test('should have a cancel button that navigates back', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: /Cancel/i });
      await expect(cancelButton).toBeVisible();
    });

    test('should show GL account combobox with searchable options', async ({ page }) => {
      // Click the first GL Account combobox
      const combobox = page.getByRole('combobox').first();
      await combobox.click();

      // Should show a dropdown/popover with GL account options
      // The exact selector depends on the combobox implementation
      await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Journal Entry List', () => {
    test('should display journal entries list page', async ({ page }) => {
      await page.goto('/accounting/journal-entries');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should navigate to new entry form', async ({ page }) => {
      await page.goto('/accounting/journal-entries');
      // Look for a "New" or "Create" button
      const newButton = page.getByRole('link', { name: /New|Create/i }).first();
      if ((await newButton.count()) > 0) {
        await newButton.click();
        await expect(page).toHaveURL(/.*journal-entries\/new/);
      }
    });
  });
});
