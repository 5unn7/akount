import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist the mock so it's available before module imports
const { mockApiClient } = vi.hoisted(() => ({
    mockApiClient: vi.fn(),
}))

// Mock the server-only client (transactions.ts imports from './client')
vi.mock('@/lib/api/client', () => ({
    apiClient: (...args: unknown[]) => mockApiClient(...args),
}))

import {
    listTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkCategorizeTransactions,
    bulkDeleteTransactions,
    deduplicateTransactions,
    getSpendingByCategory,
} from '../transactions'
import type {
    Transaction,
    ListTransactionsResponse,
    CreateTransactionInput,
    UpdateTransactionInput,
    SpendingByCategoryResponse,
} from '../transactions'

// ============================================================================
// Mock Data (integer cents per invariant #2)
// ============================================================================

const MOCK_TRANSACTION: Transaction = {
    id: 'txn-001',
    accountId: 'acc-001',
    date: '2024-06-15T00:00:00Z',
    description: 'Grocery Store',
    amount: -7500, // -$75.00 (expense, integer cents)
    currency: 'CAD',
    categoryId: 'cat-001',
    notes: null,
    sourceType: 'MANUAL',
    sourceId: undefined,
    journalEntryId: undefined,
    isStaged: false,
    isSplit: false,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
}

const MOCK_LIST_RESPONSE: ListTransactionsResponse = {
    transactions: [MOCK_TRANSACTION],
    nextCursor: 'cur-next',
    hasMore: true,
}

describe('transactions API client', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── listTransactions ───────────────────────────────────────────────

    describe('listTransactions', () => {
        it('should call /api/banking/transactions with no params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            const result = await listTransactions()

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions')
            expect(result.transactions).toHaveLength(1)
        })

        it('should append accountId filter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({ accountId: 'acc-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('accountId=acc-001')
        })

        it('should append categoryId filter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({ categoryId: 'cat-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('categoryId=cat-001')
        })

        it('should append date range filters', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({ startDate: '2024-01-01', endDate: '2024-06-30' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('startDate=2024-01-01')
            expect(url).toContain('endDate=2024-06-30')
        })

        it('should append cursor and limit for pagination', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({ cursor: 'cur-abc', limit: 50 })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('cursor=cur-abc')
            expect(url).toContain('limit=50')
        })

        it('should append entityId', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({ entityId: 'ent-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
        })

        it('should combine all filter parameters', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listTransactions({
                entityId: 'ent-001',
                accountId: 'acc-001',
                categoryId: 'cat-001',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                cursor: 'cur-xyz',
                limit: 25,
            })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('accountId=acc-001')
            expect(url).toContain('categoryId=cat-001')
            expect(url).toContain('startDate=2024-01-01')
            expect(url).toContain('endDate=2024-12-31')
            expect(url).toContain('cursor=cur-xyz')
            expect(url).toContain('limit=25')
            expect(url).toContain('entityId=ent-001')
        })

        it('should propagate errors from apiClient', async () => {
            mockApiClient.mockRejectedValueOnce(new Error('Network error'))

            await expect(listTransactions()).rejects.toThrow('Network error')
        })
    })

    // ── getTransaction ─────────────────────────────────────────────────

    describe('getTransaction', () => {
        it('should call /api/banking/transactions/:id', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_TRANSACTION)

            const result = await getTransaction('txn-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions/txn-001')
            expect(result.amount).toBe(-7500) // integer cents
        })
    })

    // ── createTransaction ──────────────────────────────────────────────

    describe('createTransaction', () => {
        it('should POST to /api/banking/transactions with JSON body', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_TRANSACTION)

            const input: CreateTransactionInput = {
                accountId: 'acc-001',
                date: '2024-06-15',
                description: 'Grocery Store',
                amount: -7500, // integer cents
                categoryId: 'cat-001',
            }

            const result = await createTransaction(input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions', {
                method: 'POST',
                body: JSON.stringify(input),
            })
            expect(result.id).toBe('txn-001')
        })
    })

    // ── updateTransaction ──────────────────────────────────────────────

    describe('updateTransaction', () => {
        it('should PATCH to /api/banking/transactions/:id with partial body', async () => {
            const updated = { ...MOCK_TRANSACTION, description: 'Updated description' }
            mockApiClient.mockResolvedValueOnce(updated)

            const input: UpdateTransactionInput = { description: 'Updated description' }
            const result = await updateTransaction('txn-001', input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions/txn-001', {
                method: 'PATCH',
                body: JSON.stringify(input),
            })
            expect(result.description).toBe('Updated description')
        })
    })

    // ── deleteTransaction ──────────────────────────────────────────────

    describe('deleteTransaction', () => {
        it('should DELETE to /api/banking/transactions/:id', async () => {
            mockApiClient.mockResolvedValueOnce(undefined)

            await deleteTransaction('txn-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions/txn-001', {
                method: 'DELETE',
            })
        })
    })

    // ── bulkCategorizeTransactions ──────────────────────────────────────

    describe('bulkCategorizeTransactions', () => {
        it('should PATCH to /api/banking/transactions/bulk/categorize', async () => {
            mockApiClient.mockResolvedValueOnce({ updated: 3 })

            const result = await bulkCategorizeTransactions(
                ['txn-001', 'txn-002', 'txn-003'],
                'cat-001'
            )

            expect(mockApiClient).toHaveBeenCalledWith(
                '/api/banking/transactions/bulk/categorize',
                {
                    method: 'PATCH',
                    body: JSON.stringify({
                        transactionIds: ['txn-001', 'txn-002', 'txn-003'],
                        categoryId: 'cat-001',
                    }),
                }
            )
            expect(result.updated).toBe(3)
        })

        it('should allow null categoryId to uncategorize', async () => {
            mockApiClient.mockResolvedValueOnce({ updated: 2 })

            await bulkCategorizeTransactions(['txn-001', 'txn-002'], null)

            const body = JSON.parse(
                (mockApiClient.mock.calls[0][1] as RequestInit).body as string
            )
            expect(body.categoryId).toBeNull()
        })
    })

    // ── bulkDeleteTransactions ─────────────────────────────────────────

    describe('bulkDeleteTransactions', () => {
        it('should POST to /api/banking/transactions/bulk/delete', async () => {
            mockApiClient.mockResolvedValueOnce({ deleted: 2 })

            const result = await bulkDeleteTransactions(['txn-001', 'txn-002'])

            expect(mockApiClient).toHaveBeenCalledWith(
                '/api/banking/transactions/bulk/delete',
                {
                    method: 'POST',
                    body: JSON.stringify({ transactionIds: ['txn-001', 'txn-002'] }),
                }
            )
            expect(result.deleted).toBe(2)
        })
    })

    // ── deduplicateTransactions ────────────────────────────────────────

    describe('deduplicateTransactions', () => {
        it('should POST to /api/banking/transactions/dedup', async () => {
            mockApiClient.mockResolvedValueOnce({ removed: 5, groups: 3 })

            const result = await deduplicateTransactions('acc-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/transactions/dedup', {
                method: 'POST',
                body: JSON.stringify({ accountId: 'acc-001' }),
            })
            expect(result.removed).toBe(5)
            expect(result.groups).toBe(3)
        })
    })

    // ── getSpendingByCategory ──────────────────────────────────────────

    describe('getSpendingByCategory', () => {
        const MOCK_SPENDING: SpendingByCategoryResponse = {
            categories: [
                {
                    categoryId: 'cat-001',
                    categoryName: 'Groceries',
                    categoryColor: '#34D399',
                    totalAmount: 25000, // $250.00 (integer cents)
                    transactionCount: 5,
                    percentOfTotal: 50,
                },
                {
                    categoryId: null,
                    categoryName: 'Uncategorized',
                    categoryColor: null,
                    totalAmount: 25000,
                    transactionCount: 3,
                    percentOfTotal: 50,
                },
            ],
            totalExpenses: 50000, // $500.00 (integer cents)
            currency: 'CAD',
        }

        it('should call /api/banking/transactions/spending-by-category with no params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_SPENDING)

            const result = await getSpendingByCategory()

            expect(mockApiClient).toHaveBeenCalledWith(
                '/api/banking/transactions/spending-by-category'
            )
            expect(result.totalExpenses).toBe(50000) // integer cents
        })

        it('should append entityId and date range params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_SPENDING)

            await getSpendingByCategory({
                entityId: 'ent-001',
                accountId: 'acc-001',
                startDate: '2024-01-01',
                endDate: '2024-06-30',
            })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
            expect(url).toContain('accountId=acc-001')
            expect(url).toContain('startDate=2024-01-01')
            expect(url).toContain('endDate=2024-06-30')
        })
    })
})
