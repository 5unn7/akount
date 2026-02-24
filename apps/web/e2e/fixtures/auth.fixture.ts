import { test as base, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TEST_DATA_PATH = path.join(__dirname, '../../playwright/.clerk/test-data.json');

interface TestEntity {
  id: string;
  name: string;
  currency: string;
}

interface TestData {
  entities: TestEntity[];
}

/**
 * Load entity data saved by auth.setup.ts.
 * Throws if setup hasn't run yet.
 */
export function loadTestData(): TestData {
  if (!fs.existsSync(TEST_DATA_PATH)) {
    throw new Error(
      'Test data not found. Run auth.setup.ts first (it runs automatically via the "setup" project).',
    );
  }
  return JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf-8'));
}

/**
 * Get the business entity from test data (first non-Personal entity).
 */
export function getBusinessEntity(): TestEntity {
  const data = loadTestData();
  const entity = data.entities.find((e) => e.name !== 'Personal');
  if (!entity) {
    throw new Error('No business entity found in test data. Check seed data.');
  }
  return entity;
}

/**
 * Set entity cookies so dashboard pages know which entity to display.
 */
export async function setEntityCookie(
  page: Page,
  entityId: string,
  currency: string = 'CAD',
): Promise<void> {
  await page.context().addCookies([
    { name: 'ak-entity-id', value: entityId, domain: 'localhost', path: '/' },
    { name: 'ak-currency', value: currency, domain: 'localhost', path: '/' },
  ]);
}

/**
 * Extended test fixture that auto-sets entity cookies before each test.
 * Use `test` from this file instead of `@playwright/test` for entity-scoped tests.
 */
export const test = base.extend<{ withEntity: void }>({
  withEntity: [
    async ({ page }, use) => {
      const entity = getBusinessEntity();
      await setEntityCookie(page, entity.id, entity.currency);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
