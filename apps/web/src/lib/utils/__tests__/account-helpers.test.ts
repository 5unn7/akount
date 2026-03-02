import { describe, it, expect } from 'vitest'
import {
    accountTypeIcons,
    accountTypeLabels,
    accountTypeColors,
    groupAccountsByCurrency,
    computeTransactionStats,
    type CurrencyGroup,
} from '../account-helpers'
import type { AccountType } from '@/lib/api/accounts'
import { mockAccount, mockTransaction } from '@/test-utils/mock-data'

const ALL_ACCOUNT_TYPES: AccountType[] = [
    'BANK',
    'CREDIT_CARD',
    'INVESTMENT',
    'LOAN',
    'MORTGAGE',
    'OTHER',
]

describe('accountTypeIcons', () => {
    it('has an icon for every account type', () => {
        for (const type of ALL_ACCOUNT_TYPES) {
            expect(accountTypeIcons[type]).toBeDefined()
        }
    })
})

describe('accountTypeLabels', () => {
    it('has a label for every account type', () => {
        for (const type of ALL_ACCOUNT_TYPES) {
            expect(accountTypeLabels[type]).toBeTruthy()
            expect(typeof accountTypeLabels[type]).toBe('string')
        }
    })

    it('returns human-readable labels', () => {
        expect(accountTypeLabels.BANK).toBe('Bank Account')
        expect(accountTypeLabels.CREDIT_CARD).toBe('Credit Card')
    })
})

describe('accountTypeColors', () => {
    it('has a color string for every account type', () => {
        for (const type of ALL_ACCOUNT_TYPES) {
            expect(accountTypeColors[type]).toBeTruthy()
            expect(typeof accountTypeColors[type]).toBe('string')
        }
    })
})

describe('groupAccountsByCurrency', () => {
    it('returns empty array for empty input', () => {
        expect(groupAccountsByCurrency([])).toEqual([])
    })

    it('groups single-currency accounts', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 100000, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: 50000, currency: 'CAD' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result).toHaveLength(1)
        expect(result[0].currency).toBe('CAD')
        expect(result[0].accounts).toHaveLength(2)
        expect(result[0].totalBalance).toBe(150000) // Integer cents
    })

    it('groups multi-currency accounts separately', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 100000, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: 200000, currency: 'USD' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result).toHaveLength(2)
        expect(result.map((g) => g.currency).sort()).toEqual(['CAD', 'USD'])
    })

    it('sorts by absolute total balance descending', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 50000, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: 200000, currency: 'USD' }),
            mockAccount({ id: 'a3', currentBalance: 100000, currency: 'EUR' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result[0].currency).toBe('USD') // Largest
        expect(result[1].currency).toBe('EUR')
        expect(result[2].currency).toBe('CAD') // Smallest
    })

    it('sorts by absolute balance (negative balances rank high)', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 50000, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: -300000, currency: 'USD' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result[0].currency).toBe('USD') // |-300000| > |50000|
    })

    it('sums balances correctly across accounts', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 100000, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: -25000, currency: 'CAD' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result[0].totalBalance).toBe(75000) // 100000 + (-25000)
    })

    it('produces integer cent totals (no float drift)', () => {
        const accounts = [
            mockAccount({ id: 'a1', currentBalance: 333, currency: 'CAD' }),
            mockAccount({ id: 'a2', currentBalance: 333, currency: 'CAD' }),
            mockAccount({ id: 'a3', currentBalance: 334, currency: 'CAD' }),
        ]
        const result = groupAccountsByCurrency(accounts)
        expect(result[0].totalBalance).toBe(1000)
        expect(Number.isInteger(result[0].totalBalance)).toBe(true)
    })
})

describe('computeTransactionStats', () => {
    it('returns zeros for empty array', () => {
        const result = computeTransactionStats([])
        expect(result).toEqual({
            incomeMTD: 0,
            expenseMTD: 0,
            unreconciledCount: 0,
            totalCount: 0,
        })
    })

    it('separates income (positive) from expense (negative)', () => {
        const transactions = [
            mockTransaction({ amount: 10000 }), // Income: $100
            mockTransaction({ amount: -5000 }), // Expense: $50
        ]
        const result = computeTransactionStats(transactions)
        expect(result.incomeMTD).toBe(10000) // Integer cents
        expect(result.expenseMTD).toBe(5000) // Absolute value, integer cents
    })

    it('counts unreconciled transactions (no journalEntryId)', () => {
        const transactions = [
            mockTransaction({ journalEntryId: null }),
            mockTransaction({ journalEntryId: 'je-001' }),
            mockTransaction({ journalEntryId: null }),
        ]
        const result = computeTransactionStats(transactions)
        expect(result.unreconciledCount).toBe(2)
    })

    it('counts total transactions', () => {
        const transactions = [
            mockTransaction({ id: 't1' }),
            mockTransaction({ id: 't2' }),
            mockTransaction({ id: 't3' }),
        ]
        const result = computeTransactionStats(transactions)
        expect(result.totalCount).toBe(3)
    })

    it('handles all-income scenario', () => {
        const transactions = [
            mockTransaction({ amount: 5000 }),
            mockTransaction({ amount: 3000 }),
        ]
        const result = computeTransactionStats(transactions)
        expect(result.incomeMTD).toBe(8000)
        expect(result.expenseMTD).toBe(0)
    })

    it('handles all-expense scenario', () => {
        const transactions = [
            mockTransaction({ amount: -5000 }),
            mockTransaction({ amount: -3000 }),
        ]
        const result = computeTransactionStats(transactions)
        expect(result.incomeMTD).toBe(0)
        expect(result.expenseMTD).toBe(8000)
    })

    it('treats zero-amount transactions as neither income nor expense', () => {
        const transactions = [mockTransaction({ amount: 0 })]
        const result = computeTransactionStats(transactions)
        expect(result.incomeMTD).toBe(0)
        expect(result.expenseMTD).toBe(0)
    })

    it('produces integer cent values (no float drift)', () => {
        const transactions = [
            mockTransaction({ amount: 333 }),
            mockTransaction({ amount: 333 }),
            mockTransaction({ amount: 334 }),
        ]
        const result = computeTransactionStats(transactions)
        expect(result.incomeMTD).toBe(1000)
        expect(Number.isInteger(result.incomeMTD)).toBe(true)
    })
})
