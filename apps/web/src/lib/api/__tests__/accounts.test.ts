import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist the mock so it's available before module imports
const { mockApiClient } = vi.hoisted(() => ({
    mockApiClient: vi.fn(),
}))

// Mock the server-only client (accounts.ts imports from './client')
vi.mock('@/lib/api/client', () => ({
    apiClient: (...args: unknown[]) => mockApiClient(...args),
}))

import {
    listAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    listAccountTransactions,
    createBankConnection,
} from '../accounts'
import type {
    Account,
    ListAccountsResponse,
    CreateAccountInput,
    UpdateAccountInput,
    ListAccountTransactionsResponse,
    BankConnectionResult,
} from '../accounts'

// ============================================================================
// Mock Data (integer cents per invariant #2)
// ============================================================================

const MOCK_ACCOUNT: Account = {
    id: 'acc-001',
    name: 'Business Checking',
    type: 'BANK',
    currency: 'CAD',
    country: 'CA',
    institution: 'Royal Bank',
    currentBalance: 250000, // $2,500.00
    isActive: true,
    glAccountId: null,
    glAccount: null,
    entity: { id: 'ent-001', name: 'Acme Corp', type: 'BUSINESS' },
}

const MOCK_LIST_RESPONSE: ListAccountsResponse = {
    accounts: [MOCK_ACCOUNT],
    nextCursor: 'cursor-abc',
    hasMore: true,
}

describe('accounts API client', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── listAccounts ───────────────────────────────────────────────────

    describe('listAccounts', () => {
        it('should call /api/banking/accounts with no params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            const result = await listAccounts()

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/accounts')
            expect(result).toEqual(MOCK_LIST_RESPONSE)
        })

        it('should append entityId query parameter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listAccounts({ entityId: 'ent-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
        })

        it('should append type filter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listAccounts({ type: 'CREDIT_CARD' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('type=CREDIT_CARD')
        })

        it('should append isActive filter as string', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listAccounts({ isActive: false })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('isActive=false')
        })

        it('should append cursor and limit for pagination', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listAccounts({ cursor: 'cur-xyz', limit: 25 })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('cursor=cur-xyz')
            expect(url).toContain('limit=25')
        })

        it('should combine multiple query parameters', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listAccounts({
                entityId: 'ent-001',
                type: 'BANK',
                isActive: true,
                limit: 10,
            })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
            expect(url).toContain('type=BANK')
            expect(url).toContain('isActive=true')
            expect(url).toContain('limit=10')
        })

        it('should propagate errors from apiClient', async () => {
            mockApiClient.mockRejectedValueOnce(new Error('API error: 500'))

            await expect(listAccounts()).rejects.toThrow('API error: 500')
        })
    })

    // ── getAccount ─────────────────────────────────────────────────────

    describe('getAccount', () => {
        it('should call /api/banking/accounts/:id', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_ACCOUNT)

            const result = await getAccount('acc-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/accounts/acc-001')
            expect(result).toEqual(MOCK_ACCOUNT)
            expect(result.currentBalance).toBe(250000) // integer cents
        })
    })

    // ── createAccount ──────────────────────────────────────────────────

    describe('createAccount', () => {
        it('should POST to /api/banking/accounts with JSON body', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_ACCOUNT)

            const input: CreateAccountInput = {
                entityId: 'ent-001',
                name: 'Business Checking',
                type: 'BANK',
                currency: 'CAD',
                country: 'CA',
                institution: 'Royal Bank',
                openingBalance: 250000, // integer cents
                openingBalanceDate: '2024-01-01',
            }

            const result = await createAccount(input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/accounts', {
                method: 'POST',
                body: JSON.stringify(input),
            })
            expect(result.id).toBe('acc-001')
        })
    })

    // ── updateAccount ──────────────────────────────────────────────────

    describe('updateAccount', () => {
        it('should PATCH to /api/banking/accounts/:id with partial body', async () => {
            const updated = { ...MOCK_ACCOUNT, name: 'Updated Checking' }
            mockApiClient.mockResolvedValueOnce(updated)

            const input: UpdateAccountInput = { name: 'Updated Checking' }
            const result = await updateAccount('acc-001', input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/accounts/acc-001', {
                method: 'PATCH',
                body: JSON.stringify(input),
            })
            expect(result.name).toBe('Updated Checking')
        })
    })

    // ── deleteAccount ──────────────────────────────────────────────────

    describe('deleteAccount', () => {
        it('should DELETE to /api/banking/accounts/:id', async () => {
            mockApiClient.mockResolvedValueOnce(undefined)

            await deleteAccount('acc-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/accounts/acc-001', {
                method: 'DELETE',
            })
        })
    })

    // ── listAccountTransactions ────────────────────────────────────────

    describe('listAccountTransactions', () => {
        const MOCK_TXN_RESPONSE: ListAccountTransactionsResponse = {
            transactions: [
                {
                    id: 'txn-001',
                    accountId: 'acc-001',
                    date: '2024-06-15T00:00:00Z',
                    description: 'Payment received',
                    amount: 50000, // $500.00 (integer cents)
                    currency: 'CAD',
                    sourceType: 'MANUAL',
                    isStaged: false,
                    isSplit: false,
                    createdAt: '2024-06-15T00:00:00Z',
                    updatedAt: '2024-06-15T00:00:00Z',
                    runningBalance: 300000, // $3,000.00
                },
            ],
            nextCursor: undefined,
            hasMore: false,
        }

        it('should call /api/banking/accounts/:id/transactions', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_TXN_RESPONSE)

            const result = await listAccountTransactions('acc-001')

            expect(mockApiClient).toHaveBeenCalledWith(
                '/api/banking/accounts/acc-001/transactions'
            )
            expect(result.transactions).toHaveLength(1)
            expect(result.transactions[0].amount).toBe(50000) // integer cents
        })

        it('should pass date range and pagination params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_TXN_RESPONSE)

            await listAccountTransactions('acc-001', {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                cursor: 'cur-abc',
                limit: 50,
            })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('startDate=2024-01-01')
            expect(url).toContain('endDate=2024-12-31')
            expect(url).toContain('cursor=cur-abc')
            expect(url).toContain('limit=50')
        })
    })

    // ── createBankConnection ──────────────────────────────────────────

    describe('createBankConnection', () => {
        it('should POST to /api/banking/connections with loginId and entityId', async () => {
            const mockResult: BankConnectionResult = {
                id: 'conn-001',
                entityId: 'ent-001',
                provider: 'flinks',
                institutionName: 'Royal Bank',
                status: 'ACTIVE',
                accounts: [
                    { id: 'ca-001', name: 'Chequing', currentBalance: 150000, currency: 'CAD' },
                ],
                accountCount: 1,
                transactionCount: 42,
                isExisting: false,
            }
            mockApiClient.mockResolvedValueOnce(mockResult)

            const result = await createBankConnection('login-abc', 'ent-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/banking/connections', {
                method: 'POST',
                body: JSON.stringify({ loginId: 'login-abc', entityId: 'ent-001' }),
            })
            expect(result.accounts[0].currentBalance).toBe(150000) // integer cents
        })
    })
})
