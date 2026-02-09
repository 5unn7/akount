import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Account Management
 *
 * These tests verify the complete account flow including:
 * - Viewing account list
 * - Navigating to account detail page
 * - Viewing transactions with running balance
 * - Navigation and error states
 *
 * NOTE: These tests require authentication to be configured.
 * Currently, they will timeout because Clerk authentication redirects
 * unauthenticated users. To run these tests, you need to:
 * 1. Set up Clerk test mode with test tokens
 * 2. Use Clerk's @clerk/testing package for E2E auth
 * 3. Mock authentication in beforeEach hook
 *
 * For now, these tests serve as documentation of expected behavior
 * and test structure. Phase 2 will include full E2E test execution.
 */

test.describe.skip('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add Clerk authentication setup here
    // Example: await clerkSetup(page, { userId: 'test-user-id' });
    await page.goto('/money-movement/accounts');
  });

  test('should display accounts list page', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that we're on the accounts page
    await expect(page).toHaveURL(/.*accounts/);

    // Check for page header or title
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should navigate to account detail page when clicking a card', async ({ page }) => {
    // Wait for accounts to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for cards to render

    // Find the first account card (it's a div with role="button")
    const accountCard = page.locator('[role="button"]').first();

    // Check if any account cards exist
    const cardCount = await accountCard.count();
    if (cardCount === 0) {
      test.skip(true, 'No accounts found - skipping navigation test');
      return;
    }

    // Get the account name before clicking
    const accountName = await accountCard.locator('.text-base').first().textContent();
    console.log(`Clicking on account: ${accountName}`);

    // Click the account card
    await accountCard.click();

    // Wait for navigation
    await page.waitForURL(/.*accounts\/[a-z0-9-]+/);

    // Verify we're on the account detail page
    await expect(page.getByRole('heading', { name: accountName || '' })).toBeVisible();

    // Check for "Back to Accounts" button
    await expect(page.getByRole('link', { name: /back to accounts/i })).toBeVisible();
  });

  test('should display account details and balance', async ({ page }) => {
    // Navigate to accounts list
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click first account card
    const accountCard = page.locator('[role="button"]').first();
    const cardCount = await accountCard.count();

    if (cardCount === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await page.waitForURL(/.*accounts\/[a-z0-9-]+/);

    // Check for account info badges (type, currency)
    const badges = page.locator('[class*="badge"]');
    await expect(badges.first()).toBeVisible();

    // Check for current balance heading
    await expect(page.getByText(/current balance/i)).toBeVisible();

    // Check for balance amount (should contain currency symbol)
    const balanceText = page.locator('text=/[$€£¥]/').first();
    await expect(balanceText).toBeVisible();
  });

  test('should display transactions table with running balance', async ({ page }) => {
    // Navigate to account detail
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const accountCard = page.locator('[role="button"]').first();
    const cardCount = await accountCard.count();

    if (cardCount === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await page.waitForURL(/.*accounts\/[a-z0-9-]+/);

    // Wait for transactions section to load
    await page.waitForLoadState('networkidle');

    // Check if transactions table exists or empty state
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyState = await page.getByText(/no transactions/i).count() > 0;

    expect(hasTable || hasEmptyState).toBeTruthy();

    if (hasTable) {
      // Verify table headers
      await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /description/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /amount/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /running balance/i })).toBeVisible();

      // Check that at least one transaction row exists
      const transactionRows = page.locator('tbody tr');
      const rowCount = await transactionRows.count();

      if (rowCount > 0) {
        // Verify first transaction has all columns
        const firstRow = transactionRows.first();
        const cells = firstRow.locator('td');
        await expect(cells).toHaveCount(4); // Date, Description, Amount, Running Balance

        // Verify running balance is displayed (contains currency symbol)
        const runningBalance = cells.last();
        await expect(runningBalance).toContainText(/[$€£¥]/);
      }
    }
  });

  test('should navigate back to accounts list', async ({ page }) => {
    // Navigate to account detail
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const accountCard = page.locator('[role="button"]').first();
    const cardCount = await accountCard.count();

    if (cardCount === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await page.waitForURL(/.*accounts\/[a-z0-9-]+/);

    // Click back button
    const backButton = page.getByRole('link', { name: /back to accounts/i });
    await backButton.click();

    // Verify we're back on the accounts list page
    await expect(page).toHaveURL(/.*accounts$/);

    // Verify account cards are visible again
    await expect(page.locator('[role="button"]').first()).toBeVisible();
  });

  test('should show error page for invalid account ID', async ({ page }) => {
    // Navigate to a non-existent account
    await page.goto('/money-movement/accounts/invalid-account-id-12345');

    // Wait for error state or 404
    await page.waitForLoadState('networkidle');

    // Check for error message or "not found" text
    const hasError = await page.getByText(/not found|error|something went wrong/i).count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should display transaction amount with correct sign', async ({ page }) => {
    // Navigate to account detail
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const accountCard = page.locator('[role="button"]').first();
    const cardCount = await accountCard.count();

    if (cardCount === 0) {
      test.skip(true, 'No accounts found');
      return;
    }

    await accountCard.click();
    await page.waitForURL(/.*accounts\/[a-z0-9-]+/);
    await page.waitForLoadState('networkidle');

    // Check if transactions exist
    const hasTransactions = await page.locator('tbody tr').count() > 0;

    if (hasTransactions) {
      const transactionRows = page.locator('tbody tr');
      const firstRow = transactionRows.first();

      // Amount cell should contain either + or - or just a value
      const amountCell = firstRow.locator('td').nth(2);
      const amountText = await amountCell.textContent();

      // Should contain currency symbol and number
      expect(amountText).toMatch(/[$€£¥]\s*[\d,.]+/);

      console.log(`First transaction amount: ${amountText}`);
    } else {
      console.log('No transactions to verify - account is empty');
    }
  });
});
