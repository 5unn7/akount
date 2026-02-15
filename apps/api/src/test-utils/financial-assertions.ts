/**
 * Financial Test Assertion Helpers
 *
 * Reusable assertions that enforce Akount's 5 key invariants in tests.
 * Import these in any test that touches financial data.
 *
 * Usage:
 *   import { assertIntegerCents, assertSoftDeleted, assertMoneyFields } from '../../test-utils/financial-assertions';
 */
import { expect } from 'vitest';

/**
 * Assert that a value is an integer (cents). Catches float contamination.
 * Use on any monetary field returned from API responses.
 */
export function assertIntegerCents(value: unknown, fieldName = 'amount'): void {
  expect(typeof value, `${fieldName} should be a number`).toBe('number');
  expect(Number.isInteger(value), `${fieldName} should be integer cents, got ${value}`).toBe(true);
}

/**
 * Assert that all monetary fields in an object are integer cents.
 * Checks common money field names: amount, currentBalance, baseCurrencyAmount, debitAmount, creditAmount.
 */
export function assertMoneyFields(
  obj: Record<string, unknown>,
  fields: string[] = ['amount', 'currentBalance', 'baseCurrencyAmount', 'debitAmount', 'creditAmount']
): void {
  for (const field of fields) {
    if (field in obj && obj[field] !== null && obj[field] !== undefined) {
      assertIntegerCents(obj[field], field);
    }
  }
}

/**
 * Assert that a record was soft-deleted (not hard-deleted).
 * Verifies deletedAt is set AND the record still exists in the database.
 */
export function assertSoftDeleted(record: Record<string, unknown>): void {
  expect(record, 'Record should still exist after soft delete').toBeTruthy();
  expect(record.deletedAt, 'deletedAt should be set after soft delete').toBeTruthy();
}

/**
 * Assert that a mock service's soft delete returned a record with deletedAt.
 * Use when testing DELETE endpoints that call softDelete* service methods.
 */
export function assertSoftDeleteResponse(mockFn: { mock: { results: Array<{ value: unknown }> } }): void {
  const result = mockFn.mock.results[0]?.value;
  if (result && typeof result === 'object' && result !== null) {
    expect('deletedAt' in (result as Record<string, unknown>), 'Soft delete response should include deletedAt').toBe(true);
  }
}

/**
 * Assert that a list response contains records with valid monetary fields.
 * Iterates all items and checks each one.
 */
export function assertListMoneyIntegrity(
  items: Record<string, unknown>[],
  moneyFields: string[] = ['amount']
): void {
  expect(items.length, 'List should contain at least one item to validate').toBeGreaterThan(0);
  for (const item of items) {
    assertMoneyFields(item, moneyFields);
  }
}
