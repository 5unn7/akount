import type { Account, AccountType } from '@/lib/api/accounts'
import type { Invoice, InvoiceLine } from '@/lib/api/invoices'
import type { Client } from '@/lib/api/clients'

// ============================================================================
// Account Mocks
// ============================================================================

export function mockAccount(overrides?: Partial<Account>): Account {
    return {
        id: 'acc-test-001',
        name: 'Test Checking',
        type: 'BANK' as AccountType,
        currency: 'CAD',
        country: 'CA',
        institution: 'Test Bank',
        currentBalance: 100000, // $1,000.00
        isActive: true,
        glAccountId: null,
        glAccount: null,
        entity: {
            id: 'ent-test-001',
            name: 'Test Entity',
            type: 'BUSINESS',
        },
        ...overrides,
    }
}

export function mockTransaction(
    overrides?: Partial<{
        id: string
        accountId: string
        amount: number
        currency: string
        date: string
        description: string
        journalEntryId: string | null
    }>
) {
    return {
        id: 'txn-test-001',
        accountId: 'acc-test-001',
        amount: -5000, // -$50.00 (expense)
        currency: 'CAD',
        date: '2024-06-15T00:00:00Z',
        description: 'Test Transaction',
        journalEntryId: null,
        ...overrides,
    }
}

// ============================================================================
// Invoice Mocks
// ============================================================================

export function mockInvoiceLine(overrides?: Partial<InvoiceLine>): InvoiceLine {
    return {
        id: 'line-test-001',
        description: 'Consulting Services',
        quantity: 1,
        unitPrice: 10000, // $100.00
        taxAmount: 500, // $5.00
        amount: 10000, // $100.00 (pre-tax)
        taxRateId: null,
        glAccountId: null,
        categoryId: null,
        ...overrides,
    }
}

export function mockInvoice(overrides?: Partial<Invoice>): Invoice {
    return {
        id: 'inv-test-001',
        entityId: 'ent-test-001',
        clientId: 'cli-test-001',
        invoiceNumber: 'INV-001',
        issueDate: '2024-06-01T00:00:00Z',
        dueDate: '2024-07-01T00:00:00Z',
        currency: 'CAD',
        subtotal: 10000, // $100.00
        taxAmount: 500, // $5.00
        total: 10500, // $105.00
        status: 'DRAFT',
        paidAmount: 0,
        notes: null,
        deletedAt: null,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        client: {
            id: 'cli-test-001',
            name: 'Test Client',
            email: 'test@example.com',
        },
        entity: {
            id: 'ent-test-001',
            name: 'Test Entity',
        },
        invoiceLines: [mockInvoiceLine()],
        ...overrides,
    }
}

// ============================================================================
// Client / Vendor Mocks
// ============================================================================

export function mockClient(overrides?: Partial<Client>): Client {
    return {
        id: 'cli-test-001',
        entityId: 'ent-test-001',
        name: 'Test Client',
        email: 'client@example.com',
        phone: '+1-555-0100',
        address: '123 Test St, Toronto, ON',
        paymentTerms: 'NET_30',
        status: 'active',
        deletedAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        entity: {
            id: 'ent-test-001',
            name: 'Test Entity',
        },
        ...overrides,
    }
}

export function mockVendor(
    overrides?: Partial<{
        id: string
        entityId: string
        name: string
        email: string | null
        phone: string | null
        address: string | null
        paymentTerms: string | null
        status: 'active' | 'inactive'
        deletedAt: string | null
        createdAt: string
        updatedAt: string
    }>
) {
    return {
        id: 'ven-test-001',
        entityId: 'ent-test-001',
        name: 'Test Vendor',
        email: 'vendor@example.com',
        phone: '+1-555-0200',
        address: '456 Vendor Ave, Toronto, ON',
        paymentTerms: 'NET_30',
        status: 'active' as const,
        deletedAt: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        ...overrides,
    }
}

// ============================================================================
// Journal Entry Mocks
// ============================================================================

export function mockJournalEntry(
    overrides?: Partial<{
        id: string
        entityId: string
        entryNumber: string
        date: string
        description: string
        status: 'DRAFT' | 'APPROVED' | 'VOIDED'
        sourceType: string | null
        sourceId: string | null
        createdAt: string
        updatedAt: string
    }>
) {
    return {
        id: 'je-test-001',
        entityId: 'ent-test-001',
        entryNumber: 'JE-001',
        date: '2024-06-01T00:00:00Z',
        description: 'Test Journal Entry',
        status: 'DRAFT' as const,
        sourceType: null,
        sourceId: null,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        ...overrides,
    }
}
