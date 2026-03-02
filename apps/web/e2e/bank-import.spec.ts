import path from 'path';
import { test, expect } from './fixtures/auth.fixture';

const SAMPLE_CSV = path.join(__dirname, 'fixtures/sample-import.csv');

test.describe('Bank Import Flow', () => {
  test.describe('Import History Page', () => {
    test('should display import history page', async ({ page }) => {
      await page.goto('/banking/imports');
      await expect(page.getByRole('heading', { name: 'Import History' })).toBeVisible();
    });

    test('should have a link to start new import', async ({ page }) => {
      await page.goto('/banking/imports');
      const newImportLink = page.getByRole('link', { name: /New Import/i });
      await expect(newImportLink).toBeVisible();
    });

    test('should navigate to import upload page', async ({ page }) => {
      await page.goto('/banking/imports');
      await page.getByRole('link', { name: /New Import/i }).click();
      await expect(page).toHaveURL(/.*banking\/import/);
    });
  });

  test.describe('Import Upload Wizard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/banking/import');
    });

    test('should display import wizard with file selection step', async ({ page }) => {
      // Step indicator should show "Select Files" as active
      await expect(page.getByText('Select Files')).toBeVisible();
    });

    test('should accept CSV file via file input', async ({ page }) => {
      // Find file input (may be hidden, Playwright can still interact)
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(SAMPLE_CSV);

      // Verify file appears in the list
      await expect(page.getByText('sample-import.csv')).toBeVisible();
    });

    test('should show account selector after file is added', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(SAMPLE_CSV);

      // Account assignment dropdown should be visible
      await expect(page.getByRole('combobox').first()).toBeVisible();
    });

    test('should not proceed without assigning an account', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(SAMPLE_CSV);

      // The upload/next button should be disabled without account assignment
      const nextButton = page.getByRole('button', { name: /Upload|Next|Import/i });
      if (await nextButton.count() > 0) {
        await expect(nextButton).toBeDisabled();
      }
    });
  });
});
