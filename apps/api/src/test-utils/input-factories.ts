/**
 * Zod Input Factories
 *
 * Validated input factories for API route testing. Each factory produces
 * data that passes Zod schema validation. Override specific fields while
 * getting sensible defaults for the rest.
 *
 * Usage:
 *   import { mockTaxRateInput, mockInvoiceInput } from '../../test-utils/input-factories';
 *
 *   const input = mockTaxRateInput({ code: 'HST', rateBasisPoints: 1300 });
 *   // ✅ Validated against CreateTaxRateSchema
 *
 *   const invoice = mockInvoiceInput({ invoiceNumber: 'INV-100' });
 *   // ✅ Validated against CreateInvoiceSchema (includes line items)
 */

import { createInputFactory } from './zod-input-factories';
import { TEST_IDS } from './mock-factories';

// Schema imports — Accounting
import { CreateTaxRateSchema } from '../domains/accounting/schemas/tax-rate.schema';
import { CreateGLAccountSchema } from '../domains/accounting/schemas/gl-account.schema';
import { CreateJournalEntrySchema } from '../domains/accounting/schemas/journal-entry.schema';

// Schema imports — Business
import { CreateInvoiceSchema } from '../domains/invoicing/schemas/invoice.schema';
import { CreateBillSchema } from '../domains/invoicing/schemas/bill.schema';
import { CreateClientSchema } from '../domains/clients/schemas/client.schema';
import { CreateVendorSchema } from '../domains/vendors/schemas/vendor.schema';

// Schema imports — Banking
import { CreateTransactionSchema } from '../domains/banking/schemas/transaction.schema';
import { CreateTransferSchema } from '../domains/banking/schemas/transfer.schema';

// ---------------------------------------------------------------------------
// Test constants for valid CUIDs (must pass z.string().cuid() validation)
// ---------------------------------------------------------------------------

const TEST_CLIENT_ID = 'cltest00000000000000client';
const TEST_VENDOR_ID = 'cltest00000000000vendor01';
const TEST_ACCOUNT_ID_1 = 'cltest0000000000000account1';
const TEST_ACCOUNT_ID_2 = 'cltest0000000000000account2';
const TEST_GL_ACCOUNT_ID = 'cltest00000000000glaccount';

// Dates in ISO 8601 format (30 days apart)
const ISSUE_DATE = '2026-01-15T00:00:00.000Z';
const DUE_DATE = '2026-02-14T00:00:00.000Z';
const TODAY = '2026-01-15T12:00:00.000Z';

// ============================================================================
// Accounting Domain
// ============================================================================

/**
 * Factory for CreateTaxRateSchema input.
 * Produces valid tax rate creation data.
 */
export const mockTaxRateInput = createInputFactory(CreateTaxRateSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  code: 'GST',
  name: 'Goods and Services Tax',
  rateBasisPoints: 500,
  jurisdiction: 'Federal (Canada)',
  isInclusive: false,
  effectiveFrom: ISSUE_DATE,
});

/**
 * Factory for CreateGLAccountSchema input.
 * Produces valid GL account creation data.
 */
export const mockGLAccountInput = createInputFactory(CreateGLAccountSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  code: '1000',
  name: 'Cash',
  type: 'ASSET',
  normalBalance: 'DEBIT',
});

/**
 * Factory for CreateJournalEntrySchema input.
 * Produces a balanced journal entry with 2 lines (debit = credit).
 */
export const mockJournalEntryInput = createInputFactory(
  CreateJournalEntrySchema,
  {
    entityId: TEST_IDS.ENTITY_ID,
    date: TODAY,
    memo: 'Test journal entry',
    lines: [
      {
        glAccountId: TEST_GL_ACCOUNT_ID,
        debitAmount: 10000, // $100.00
        creditAmount: 0,
      },
      {
        glAccountId: TEST_GL_ACCOUNT_ID,
        debitAmount: 0,
        creditAmount: 10000, // $100.00
      },
    ],
  },
);

// ============================================================================
// Business Domain — Invoicing
// ============================================================================

/**
 * Factory for CreateInvoiceSchema input.
 * Produces valid invoice with one line item.
 * Note: dueDate >= issueDate (enforced by schema refinement).
 */
export const mockInvoiceInput = createInputFactory(CreateInvoiceSchema, {
  clientId: TEST_CLIENT_ID,
  invoiceNumber: 'INV-001',
  issueDate: ISSUE_DATE,
  dueDate: DUE_DATE,
  currency: 'CAD',
  subtotal: 10000, // $100.00
  taxAmount: 500, // $5.00
  total: 10500, // $105.00
  lines: [
    {
      description: 'Professional Services',
      quantity: 1,
      unitPrice: 10000,
      amount: 10000,
      taxAmount: 500,
    },
  ],
});

/**
 * Factory for CreateBillSchema input.
 * Produces valid bill with one line item.
 */
export const mockBillInput = createInputFactory(CreateBillSchema, {
  vendorId: TEST_VENDOR_ID,
  billNumber: 'BILL-001',
  issueDate: ISSUE_DATE,
  dueDate: DUE_DATE,
  currency: 'CAD',
  subtotal: 20000, // $200.00
  taxAmount: 1000, // $10.00
  total: 21000, // $210.00
  lines: [
    {
      description: 'Office Supplies',
      quantity: 1,
      unitPrice: 20000,
      amount: 20000,
      taxAmount: 1000,
    },
  ],
});

// ============================================================================
// Business Domain — Clients / Vendors
// ============================================================================

/**
 * Factory for CreateClientSchema input.
 */
export const mockClientInput = createInputFactory(CreateClientSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  name: 'Acme Corp',
  email: 'acme@example.com',
});

/**
 * Factory for CreateVendorSchema input.
 */
export const mockVendorInput = createInputFactory(CreateVendorSchema, {
  entityId: TEST_IDS.ENTITY_ID,
  name: 'Supplies Inc',
  email: 'supplies@example.com',
});

// ============================================================================
// Banking Domain
// ============================================================================

/**
 * Factory for CreateTransactionSchema input.
 */
export const mockTransactionInput = createInputFactory(
  CreateTransactionSchema,
  {
    accountId: TEST_ACCOUNT_ID_1,
    date: TODAY,
    description: 'Test Transaction',
    amount: -5000, // -$50.00 (expense)
    currency: 'CAD',
    sourceType: 'MANUAL',
  },
);

/**
 * Factory for CreateTransferSchema input.
 * Note: fromAccountId !== toAccountId (enforced by schema refinement).
 */
export const mockTransferInput = createInputFactory(CreateTransferSchema, {
  fromAccountId: TEST_ACCOUNT_ID_1,
  toAccountId: TEST_ACCOUNT_ID_2,
  amount: 50000, // $500.00
  currency: 'CAD',
  date: TODAY,
  memo: 'Test transfer',
});
