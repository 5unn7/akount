/**
 * Centralized Mock Data Factories
 *
 * Provides type-safe mock data for unit tests (Prisma model mocking).
 * All monetary values use integer cents. All records include
 * createdAt/updatedAt. Soft-deletable records default to deletedAt: null.
 *
 * ✅ TYPE-SAFE: All factories use Prisma model types
 * Schema changes cause TypeScript errors in these factories (not in 140+ test files)
 *
 * MIGRATION NOTE (2026-02-28):
 * For NEW tests, prefer:
 * - Prisma model mocks: Use these type-safe factories (this file)
 * - API route inputs: Use mock*Input from ./input-factories
 *   (validated against Zod schemas, catches schema drift)
 *
 * Usage:
 *   import { TEST_IDS, mockAccount, mockInvoice } from '../../test-utils';
 */

import type {
  Entity,
  TenantUser,
  Account,
  Transaction,
  Invoice,
  Bill,
  Client,
  Vendor,
  Payment,
  GLAccount,
  JournalEntry,
  JournalLine,
  Category,
  TaxRate,
  Insight,
  AIAction,
} from '@akount/db';

// ---------------------------------------------------------------------------
// Shared Test Constants
// ---------------------------------------------------------------------------

export const TEST_IDS = {
  TENANT_ID: 'tenant-abc-123',
  OTHER_TENANT_ID: 'tenant-other-999',
  USER_ID: 'test-user-id',
  OTHER_USER_ID: 'test-user-other',
  ENTITY_ID: 'cltest00000000000000entity',
  OTHER_ENTITY_ID: 'cltest0000000000000entity2',
} as const;

const NOW = new Date('2026-01-15T12:00:00.000Z');

// ---------------------------------------------------------------------------
// Entity / Tenant
// ---------------------------------------------------------------------------

export function mockEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: TEST_IDS.ENTITY_ID,
    tenantId: TEST_IDS.TENANT_ID,
    name: 'Test Corp',
    type: 'CORPORATION',
    status: 'ACTIVE',
    functionalCurrency: 'CAD',
    fiscalYearEnd: 12,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Entity;
}

export function mockTenantUser(overrides: Partial<TenantUser> = {}): TenantUser {
  return {
    id: 'tu-1',
    tenantId: TEST_IDS.TENANT_ID,
    userId: TEST_IDS.USER_ID,
    role: 'OWNER',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as TenantUser;
}

// ---------------------------------------------------------------------------
// Banking
// ---------------------------------------------------------------------------

export function mockAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Checking Account',
    type: 'BANK',
    currency: 'CAD',
    country: 'CA',
    institution: null,
    currentBalance: 1000000, // $10,000.00
    isActive: true,
    glAccountId: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Account;
}

export function mockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    accountId: 'acc-1',
    entityId: TEST_IDS.ENTITY_ID,
    date: NOW,
    description: 'Test Transaction',
    amount: -5000, // -$50.00
    currency: 'CAD',
    exchangeRate: 1.0,
    baseCurrencyAmount: -5000,
    type: 'EXPENSE',
    categoryId: null,
    isReconciled: false,
    sourceType: null,
    sourceId: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    account: { entity: { tenantId: TEST_IDS.TENANT_ID } },
    ...overrides,
  } as Transaction;
}

/**
 * ❌ DEPRECATED: Transfer model doesn't exist in Prisma schema
 * This is exactly the schema drift that type-safe factories catch!
 * Use mockTransaction for account transfer scenarios instead.
 */
// export function mockTransfer(overrides = {}) {
//   return { ... };
// }

// ---------------------------------------------------------------------------
// Business (Invoicing / Bills / Payments)
// ---------------------------------------------------------------------------

export function mockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    entityId: TEST_IDS.ENTITY_ID,
    clientId: 'client-1',
    invoiceNumber: 'INV-001',
    status: 'DRAFT',
    issueDate: NOW,
    dueDate: new Date('2026-02-15'),
    subtotalAmount: 10000, // $100.00
    taxAmount: 500, // $5.00
    totalAmount: 10500, // $105.00
    amountPaid: 0,
    amountDue: 10500,
    currency: 'CAD',
    exchangeRate: 1.0,
    baseCurrencyAmount: 10500,
    notes: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Invoice;
}

export function mockBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill-1',
    entityId: TEST_IDS.ENTITY_ID,
    vendorId: 'vendor-1',
    billNumber: 'BILL-001',
    status: 'DRAFT',
    issueDate: NOW,
    dueDate: new Date('2026-02-15'),
    subtotalAmount: 20000, // $200.00
    taxAmount: 1000, // $10.00
    totalAmount: 21000, // $210.00
    amountPaid: 0,
    amountDue: 21000,
    currency: 'CAD',
    exchangeRate: 1.0,
    baseCurrencyAmount: 21000,
    notes: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Bill;
}

export function mockClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Acme Corp',
    email: 'acme@example.com',
    phone: null,
    address: null,
    outstandingBalance: 0,
    currency: 'CAD',
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Client;
}

export function mockVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'vendor-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Supplies Inc',
    email: 'supplies@example.com',
    phone: null,
    address: null,
    outstandingBalance: 0,
    currency: 'CAD',
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Vendor;
}

export function mockPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pmt-1',
    entityId: TEST_IDS.ENTITY_ID,
    amount: 10500, // $105.00
    currency: 'CAD',
    exchangeRate: 1.0,
    baseCurrencyAmount: 10500,
    paymentDate: NOW,
    paymentMethod: 'BANK_TRANSFER',
    reference: 'PMT-001',
    notes: null,
    journalEntryId: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Payment;
}

// ---------------------------------------------------------------------------
// Accounting
// ---------------------------------------------------------------------------

export function mockGLAccount(overrides: Partial<GLAccount> = {}): GLAccount {
  return {
    id: 'gl-1',
    entityId: TEST_IDS.ENTITY_ID,
    code: '1000',
    name: 'Cash',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: null,
    parentAccountId: null,
    isActive: true,
    isCTAAccount: false,
    isEliminationAccount: false,
    consolidationCode: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    _count: { childAccounts: 0, journalLines: 0 },
    ...overrides,
  } as GLAccount;
}

export function mockJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'je-1',
    entityId: TEST_IDS.ENTITY_ID,
    entryNumber: 'JE-001',
    date: NOW,
    description: 'Test journal entry',
    status: 'POSTED',
    sourceType: null,
    sourceId: null,
    sourceDocument: null,
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    lines: [],
    ...overrides,
  } as JournalEntry;
}

export function mockJournalLine(overrides: Partial<JournalLine> = {}): JournalLine {
  return {
    id: 'jl-1',
    journalEntryId: 'je-1',
    glAccountId: 'gl-1',
    debitAmount: 10000, // $100.00
    creditAmount: 0,
    currency: 'CAD',
    exchangeRate: 1.0,
    baseCurrencyDebitAmount: 10000,
    baseCurrencyCreditAmount: 0,
    description: 'Test line',
    deletedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as JournalLine;
}

export function mockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    entityId: TEST_IDS.ENTITY_ID,
    name: 'Office Supplies',
    type: 'EXPENSE',
    glAccountId: 'gl-1',
    parentCategoryId: null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as Category;
}

export function mockTaxRate(overrides: Partial<TaxRate> = {}): TaxRate {
  return {
    id: 'tax-1',
    entityId: TEST_IDS.ENTITY_ID,
    code: 'GST',
    name: 'Goods and Services Tax',
    rateBasisPoints: 500, // ✅ SCHEMA-SAFE: Compiler enforces this field (was 'rate')
    jurisdiction: 'Federal (Canada)',
    isInclusive: false,
    isActive: true,
    effectiveFrom: new Date('2026-01-01'),
    effectiveTo: null,
    createdAt: NOW,
    updatedAt: NOW,
    entity: { id: TEST_IDS.ENTITY_ID, tenantId: TEST_IDS.TENANT_ID },
    ...overrides,
  } as TaxRate;
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export function mockInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight-1',
    entityId: TEST_IDS.ENTITY_ID,
    triggerId: 'cash_flow_warning:entity:2026-01',
    title: 'Cash Flow Warning',
    description: 'Projected balance dropping below threshold',
    type: 'cash_flow_warning',
    priority: 'critical',
    status: 'active',
    metadata: null,
    dismissedAt: null,
    snoozedUntil: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as Insight;
}

export function mockAIAction(overrides: Partial<AIAction> = {}): AIAction {
  return {
    id: 'action-1',
    entityId: TEST_IDS.ENTITY_ID,
    type: 'CATEGORIZE_TRANSACTION',
    status: 'PENDING',
    confidence: 85,
    payload: {},
    result: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as AIAction;
}
