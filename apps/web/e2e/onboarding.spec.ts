import { test, expect } from '@playwright/test';

/**
 * Onboarding Flow E2E Tests
 *
 * CURRENT STATUS: The seeded test user (dev+clerk_test@akount.ai) has
 * onboardingCompleted=true in Clerk session metadata. Middleware redirects
 * completed users from /onboarding to /overview.
 *
 * TO ENABLE FULL WIZARD TESTS:
 * 1. Create a second Clerk test user with NO onboardingCompleted metadata
 * 2. Add a separate auth setup project for the onboarding user
 * 3. Un-skip the wizard describe blocks below
 *
 * WIZARD FLOW (for reference):
 * Welcome (personal/business) -> Intent (multi-select goals) ->
 * Employment (status) -> [Business Setup (conditional)] ->
 * Address (country) -> Completion -> /overview
 */

test.describe('Onboarding — Completed User', () => {
  test('should redirect from /onboarding to /overview for completed user', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/(overview|onboarding\/complete)/);
  });

  test('should load the dashboard after redirect', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForURL(/\/(overview|onboarding\/complete)/);
    // Dashboard should have some content visible
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe.skip('Onboarding — Fresh User (requires separate test user)', () => {
  test('should display welcome step with personal/business options', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page.getByText(/just me/i)).toBeVisible();
    await expect(page.getByText(/me.*my business/i)).toBeVisible();
  });

  test('should complete personal onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    // Step 1: Welcome — choose "Just me"
    // Step 2: Intent — select goals
    // Step 3: Employment — select status
    // Step 4: Address — fill form
    // Step 5: Verify redirect to /overview
  });

  test('should complete business onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    // Step 1: Welcome — choose "Me + my business"
    // Step 2: Intent — select goals
    // Step 3: Employment — select status
    // Step 4: Business Setup — fill business name, type
    // Step 5: Address — fill form
    // Step 6: Verify redirect to /overview
  });
});
