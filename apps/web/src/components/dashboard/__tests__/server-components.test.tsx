import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Mocks for server-side API functions
// ============================================================================

vi.mock('@/lib/api/dashboard', () => ({
    getDashboardMetrics: vi.fn(),
}))

vi.mock('@/lib/api/accounts', () => ({
    listAccounts: vi.fn(),
}))

vi.mock('next/link', () => ({
    default: ({
        children,
        href,
        ...props
    }: {
        children: React.ReactNode
        href: string
        [key: string]: unknown
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

import { DashboardMetrics } from '../DashboardMetrics'
import { EntityAccountCards } from '../EntityAccountCards'
import { getDashboardMetrics } from '@/lib/api/dashboard'
import { listAccounts } from '@/lib/api/accounts'
import type { DashboardMetrics as DashboardMetricsType } from '@/lib/api/dashboard'

// ============================================================================
// Test data
// ============================================================================

const MOCK_METRICS: DashboardMetricsType = {
    netWorth: { amount: 5000000, currency: 'CAD' }, // $50,000.00
    cashPosition: {
        cash: 7500000, // $75,000.00
        debt: 2500000, // $25,000.00
        net: 5000000, // $50,000.00
        currency: 'CAD',
    },
    accounts: {
        total: 5,
        active: 4,
        byType: { BANK: 2, CREDIT_CARD: 2 },
    },
}

const MOCK_ACCOUNTS = [
    {
        id: 'acc-1',
        name: 'Main Checking',
        type: 'BANK' as const,
        currency: 'CAD',
        country: 'CA',
        institution: 'TD',
        currentBalance: 5000000, // $50,000.00
        isActive: true,
        glAccountId: null,
        glAccount: null,
        entity: { id: 'ent-1', name: 'Acme Corp', type: 'BUSINESS' },
    },
    {
        id: 'acc-2',
        name: 'Visa Card',
        type: 'CREDIT_CARD' as const,
        currency: 'CAD',
        country: 'CA',
        institution: 'TD',
        currentBalance: -150000, // -$1,500.00 (negative = owed)
        isActive: true,
        glAccountId: null,
        glAccount: null,
        entity: { id: 'ent-1', name: 'Acme Corp', type: 'BUSINESS' },
    },
]

// ============================================================================
// DashboardMetrics
// ============================================================================

describe('DashboardMetrics', () => {
    beforeEach(() => {
        vi.mocked(getDashboardMetrics).mockReset()
    })

    it('renders cash position, total debt, and working capital cards', async () => {
        vi.mocked(getDashboardMetrics).mockResolvedValue(MOCK_METRICS)

        const element = await DashboardMetrics({ entityId: 'ent-1' })
        render(element)

        expect(screen.getByText('Cash Position')).toBeInTheDocument()
        expect(screen.getByText('Total Debt')).toBeInTheDocument()
        expect(screen.getByText('Working Capital')).toBeInTheDocument()
    })

    it('displays formatted currency amounts', async () => {
        vi.mocked(getDashboardMetrics).mockResolvedValue(MOCK_METRICS)

        const element = await DashboardMetrics({ entityId: 'ent-1' })
        render(element)

        // $75,000.00 cash
        expect(screen.getByText(/75,000\.00/)).toBeInTheDocument()
        // $25,000.00 debt
        expect(screen.getByText(/25,000\.00/)).toBeInTheDocument()
        // $50,000.00 working capital (cash - debt)
        expect(screen.getByText(/50,000\.00/)).toBeInTheDocument()
    })

    it('shows descriptive labels', async () => {
        vi.mocked(getDashboardMetrics).mockResolvedValue(MOCK_METRICS)

        const element = await DashboardMetrics({ entityId: 'ent-1' })
        render(element)

        expect(screen.getByText('Available cash')).toBeInTheDocument()
        expect(screen.getByText(/Credit cards/)).toBeInTheDocument()
        expect(screen.getByText('Cash minus debt')).toBeInTheDocument()
    })

    it('renders error state when API fails', async () => {
        vi.mocked(getDashboardMetrics).mockRejectedValue(
            new Error('Network error')
        )

        const element = await DashboardMetrics({ entityId: 'ent-1' })
        render(element)

        expect(
            screen.getByText(/Failed to load dashboard metrics/)
        ).toBeInTheDocument()
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })

    it('passes default currency CAD when none specified', async () => {
        vi.mocked(getDashboardMetrics).mockResolvedValue(MOCK_METRICS)

        await DashboardMetrics({})
        expect(getDashboardMetrics).toHaveBeenCalledWith(undefined, 'CAD')
    })

    it('passes custom currency when specified', async () => {
        vi.mocked(getDashboardMetrics).mockResolvedValue(MOCK_METRICS)

        await DashboardMetrics({ entityId: 'ent-1', currency: 'USD' })
        expect(getDashboardMetrics).toHaveBeenCalledWith('ent-1', 'USD')
    })
})

// ============================================================================
// EntityAccountCards
// ============================================================================

describe('EntityAccountCards', () => {
    beforeEach(() => {
        vi.mocked(listAccounts).mockReset()
    })

    it('renders account cards with names and types', async () => {
        vi.mocked(listAccounts).mockResolvedValue({
            accounts: MOCK_ACCOUNTS,
        })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        expect(screen.getByText('Main Checking')).toBeInTheDocument()
        expect(screen.getByText('Bank Account')).toBeInTheDocument()
        expect(screen.getByText('Visa Card')).toBeInTheDocument()
        expect(screen.getByText('Credit Card')).toBeInTheDocument()
    })

    it('displays formatted balances', async () => {
        vi.mocked(listAccounts).mockResolvedValue({
            accounts: MOCK_ACCOUNTS,
        })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        // $50,000.00 positive balance
        expect(screen.getByText(/50,000\.00/)).toBeInTheDocument()
        // $1,500.00 negative balance
        expect(screen.getByText(/1,500\.00/)).toBeInTheDocument()
    })

    it('applies red color to negative balances', async () => {
        vi.mocked(listAccounts).mockResolvedValue({
            accounts: MOCK_ACCOUNTS,
        })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        // Find the negative balance element (Visa Card: -$1,500.00)
        const negativeEl = screen.getByText(/1,500\.00/)
        expect(negativeEl.className).toContain('text-ak-red')
    })

    it('renders account links to detail pages', async () => {
        vi.mocked(listAccounts).mockResolvedValue({
            accounts: MOCK_ACCOUNTS,
        })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(2)
        expect(links[0]).toHaveAttribute(
            'href',
            '/banking/accounts/acc-1'
        )
        expect(links[1]).toHaveAttribute(
            'href',
            '/banking/accounts/acc-2'
        )
    })

    it('displays currency code for each account', async () => {
        vi.mocked(listAccounts).mockResolvedValue({
            accounts: MOCK_ACCOUNTS,
        })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        const cadLabels = screen.getAllByText('CAD')
        expect(cadLabels.length).toBeGreaterThanOrEqual(2)
    })

    it('shows empty state when no accounts', async () => {
        vi.mocked(listAccounts).mockResolvedValue({ accounts: [] })

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        expect(screen.getByText('No accounts yet')).toBeInTheDocument()
        expect(
            screen.getByText(/Add a bank account or credit card/)
        ).toBeInTheDocument()
    })

    it('shows error state when API fails', async () => {
        vi.mocked(listAccounts).mockRejectedValue(
            new Error('Network error')
        )

        const element = await EntityAccountCards({
            entityId: 'ent-1',
            currency: 'CAD',
        })
        render(element)

        expect(
            screen.getByText('Failed to load accounts.')
        ).toBeInTheDocument()
    })

    it('passes entityId and isActive filter to API', async () => {
        vi.mocked(listAccounts).mockResolvedValue({ accounts: [] })

        await EntityAccountCards({ entityId: 'ent-1', currency: 'CAD' })
        expect(listAccounts).toHaveBeenCalledWith({
            entityId: 'ent-1',
            isActive: true,
        })
    })
})
