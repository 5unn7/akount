import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// ============================================================================
// Mocks
// ============================================================================

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

const mockGetProfitLoss = vi.fn()
const mockGetTrialBalance = vi.fn()
const mockGetTopRevenue = vi.fn()

vi.mock('@/lib/api/dashboard-client', () => ({
    getProfitLossSummary: (...args: unknown[]) => mockGetProfitLoss(...args),
    getTrialBalanceStatus: (...args: unknown[]) => mockGetTrialBalance(...args),
    getTopRevenueClients: (...args: unknown[]) => mockGetTopRevenue(...args),
}))

import { ProfitLossSummaryWidget } from '../ProfitLossSummaryWidget'
import { TrialBalanceStatusWidget } from '../TrialBalanceStatusWidget'
import { TopRevenueClientsWidget } from '../TopRevenueClientsWidget'
import type { ProfitLossReport, TrialBalanceReport, RevenueReport } from '@akount/types/financial'

// ============================================================================
// Test data (all integer cents)
// ============================================================================

const MOCK_PL: ProfitLossReport = {
    entityName: 'Test Entity',
    currency: 'CAD',
    startDate: '2026-01-01',
    endDate: '2026-02-25',
    revenue: { sections: [], total: 5000000 }, // $50,000
    expenses: { sections: [], total: 2000000 }, // $20,000
    netIncome: 3000000, // $30,000
}

const MOCK_PL_ZERO: ProfitLossReport = {
    entityName: 'Test Entity',
    currency: 'CAD',
    startDate: '2026-01-01',
    endDate: '2026-02-25',
    revenue: { sections: [], total: 0 },
    expenses: { sections: [], total: 0 },
    netIncome: 0,
}

const MOCK_TB_BALANCED: TrialBalanceReport = {
    entityName: 'Test Entity',
    currency: 'CAD',
    asOfDate: '2026-02-25',
    accounts: [
        { id: 'gl-1', code: '1000', name: 'Cash', debit: 5000000, credit: 0 },
        { id: 'gl-2', code: '3000', name: 'Equity', debit: 0, credit: 5000000 },
    ],
    totalDebits: 5000000,
    totalCredits: 5000000,
    isBalanced: true,
    severity: 'OK',
}

const MOCK_TB_UNBALANCED: TrialBalanceReport = {
    entityName: 'Test Entity',
    currency: 'CAD',
    asOfDate: '2026-02-25',
    accounts: [
        { id: 'gl-1', code: '1000', name: 'Cash', debit: 5000000, credit: 0 },
        { id: 'gl-2', code: '3000', name: 'Equity', debit: 0, credit: 4500000 },
    ],
    totalDebits: 5000000,
    totalCredits: 4500000,
    isBalanced: false,
    severity: 'CRITICAL',
}

const MOCK_REVENUE: RevenueReport = {
    entityName: 'Test Entity',
    currency: 'CAD',
    startDate: '2026-01-01',
    endDate: '2026-02-25',
    clients: [
        { clientId: 'c1', clientName: 'Acme Corp', invoiceCount: 5, amount: 3000000, percentage: 60 },
        { clientId: 'c2', clientName: 'Beta Inc', invoiceCount: 3, amount: 1500000, percentage: 30 },
        { clientId: 'c3', clientName: 'Gamma LLC', invoiceCount: 1, amount: 500000, percentage: 10 },
    ],
    totalRevenue: 5000000,
}

// ============================================================================
// ProfitLossSummaryWidget
// ============================================================================

describe('ProfitLossSummaryWidget', () => {
    beforeEach(() => {
        mockGetProfitLoss.mockReset()
    })

    it('shows loading skeleton initially', () => {
        mockGetProfitLoss.mockReturnValue(new Promise(() => {})) // Never resolves
        render(<ProfitLossSummaryWidget />)
        expect(screen.getByText('P&L Summary')).toBeInTheDocument()
    })

    it('renders revenue, expenses, and net income', async () => {
        mockGetProfitLoss.mockResolvedValue(MOCK_PL)
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(screen.getByText('Revenue')).toBeInTheDocument()
        })

        expect(screen.getByText('Expenses')).toBeInTheDocument()
        expect(screen.getByText('Net Income')).toBeInTheDocument()
    })

    it('displays formatted currency amounts', async () => {
        mockGetProfitLoss.mockResolvedValue(MOCK_PL)
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(screen.getByText(/50,000\.00/)).toBeInTheDocument() // Revenue
        })
        expect(screen.getByText(/20,000\.00/)).toBeInTheDocument() // Expenses
        expect(screen.getByText(/30,000\.00/)).toBeInTheDocument() // Net Income
    })

    it('shows "View report" link to accounting reports', async () => {
        mockGetProfitLoss.mockResolvedValue(MOCK_PL)
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(screen.getByText('View report')).toBeInTheDocument()
        })

        expect(screen.getByText('View report').closest('a')).toHaveAttribute(
            'href',
            '/accounting/reports'
        )
    })

    it('shows empty state when revenue and expenses are zero', async () => {
        mockGetProfitLoss.mockResolvedValue(MOCK_PL_ZERO)
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('No P&L data for this period')
            ).toBeInTheDocument()
        })
    })

    it('shows error state when API fails', async () => {
        mockGetProfitLoss.mockRejectedValue(new Error('fail'))
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load P&L data')
            ).toBeInTheDocument()
        })
    })

    it('shows negative net income styling for loss', async () => {
        const loss: ProfitLossReport = {
            ...MOCK_PL,
            netIncome: -1000000, // -$10,000 loss
        }
        mockGetProfitLoss.mockResolvedValue(loss)
        render(<ProfitLossSummaryWidget />)

        await waitFor(() => {
            expect(screen.getByText('Net Income')).toBeInTheDocument()
        })

        // Net income amount should show absolute value formatted
        expect(screen.getByText(/10,000\.00/)).toBeInTheDocument()
    })
})

// ============================================================================
// TrialBalanceStatusWidget
// ============================================================================

describe('TrialBalanceStatusWidget', () => {
    beforeEach(() => {
        mockGetTrialBalance.mockReset()
    })

    it('shows loading skeleton initially', () => {
        mockGetTrialBalance.mockReturnValue(new Promise(() => {}))
        render(<TrialBalanceStatusWidget />)
        expect(screen.getByText('Trial Balance')).toBeInTheDocument()
    })

    it('shows balanced status with green styling', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_BALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Balanced')).toBeInTheDocument()
        })
    })

    it('shows out of balance status with red styling', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_UNBALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Out of Balance')).toBeInTheDocument()
        })
    })

    it('displays total debits and credits', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_BALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Total Debits')).toBeInTheDocument()
        })
        expect(screen.getByText('Total Credits')).toBeInTheDocument()
        // Both should show $50,000.00
        const amounts = screen.getAllByText(/50,000\.00/)
        expect(amounts.length).toBeGreaterThanOrEqual(2)
    })

    it('shows difference when unbalanced', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_UNBALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Difference')).toBeInTheDocument()
        })
        // |$50,000 - $45,000| = $5,000 — find the element with red styling
        const differenceRow = screen.getByText('Difference').closest('div')!
        const differenceAmount = differenceRow.querySelector(
            '.text-ak-red.font-medium'
        )
        expect(differenceAmount).toBeTruthy()
        expect(differenceAmount!.textContent).toContain('5,000.00')
    })

    it('does not show difference when balanced', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_BALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Balanced')).toBeInTheDocument()
        })
        expect(screen.queryByText('Difference')).not.toBeInTheDocument()
    })

    it('shows account count', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_BALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText(/2 accounts/)).toBeInTheDocument()
        })
    })

    it('shows Critical label for critical severity', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_UNBALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('Critical')).toBeInTheDocument()
        })
    })

    it('shows "View details" link', async () => {
        mockGetTrialBalance.mockResolvedValue(MOCK_TB_BALANCED)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(screen.getByText('View details')).toBeInTheDocument()
        })
        expect(
            screen.getByText('View details').closest('a')
        ).toHaveAttribute('href', '/accounting/reports')
    })

    it('shows empty state when no accounts', async () => {
        const empty: TrialBalanceReport = {
            ...MOCK_TB_BALANCED,
            accounts: [],
        }
        mockGetTrialBalance.mockResolvedValue(empty)
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('No trial balance data')
            ).toBeInTheDocument()
        })
    })

    it('shows error state when API fails', async () => {
        mockGetTrialBalance.mockRejectedValue(new Error('fail'))
        render(<TrialBalanceStatusWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load trial balance')
            ).toBeInTheDocument()
        })
    })
})

// ============================================================================
// TopRevenueClientsWidget
// ============================================================================

describe('TopRevenueClientsWidget', () => {
    beforeEach(() => {
        mockGetTopRevenue.mockReset()
    })

    it('shows loading skeleton initially', () => {
        mockGetTopRevenue.mockReturnValue(new Promise(() => {}))
        render(<TopRevenueClientsWidget />)
        expect(screen.getByText('Top Revenue Clients')).toBeInTheDocument()
    })

    it('renders client names', async () => {
        mockGetTopRevenue.mockResolvedValue(MOCK_REVENUE)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('Acme Corp')).toBeInTheDocument()
        })
        expect(screen.getByText('Beta Inc')).toBeInTheDocument()
        expect(screen.getByText('Gamma LLC')).toBeInTheDocument()
    })

    it('displays percentage for each client', async () => {
        mockGetTopRevenue.mockResolvedValue(MOCK_REVENUE)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('60.0%')).toBeInTheDocument()
        })
        expect(screen.getByText('30.0%')).toBeInTheDocument()
        expect(screen.getByText('10.0%')).toBeInTheDocument()
    })

    it('displays formatted revenue amounts', async () => {
        mockGetTopRevenue.mockResolvedValue(MOCK_REVENUE)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('$30,000.00')).toBeInTheDocument() // Acme
        })
        expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Beta
        expect(screen.getByText('$5,000.00')).toBeInTheDocument() // Gamma
    })

    it('shows total revenue and client count in footer', async () => {
        mockGetTopRevenue.mockResolvedValue(MOCK_REVENUE)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('3 clients')).toBeInTheDocument()
        })
        expect(screen.getByText(/50,000\.00/)).toBeInTheDocument()
    })

    it('shows "View all" link to clients page', async () => {
        mockGetTopRevenue.mockResolvedValue(MOCK_REVENUE)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('View all')).toBeInTheDocument()
        })
        expect(screen.getByText('View all').closest('a')).toHaveAttribute(
            'href',
            '/business/clients'
        )
    })

    it('shows empty state when no clients', async () => {
        const empty: RevenueReport = {
            ...MOCK_REVENUE,
            clients: [],
        }
        mockGetTopRevenue.mockResolvedValue(empty)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('No revenue data for this period')
            ).toBeInTheDocument()
        })
    })

    it('shows error state when API fails', async () => {
        mockGetTopRevenue.mockRejectedValue(new Error('fail'))
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load revenue data')
            ).toBeInTheDocument()
        })
    })

    it('handles single client with "1 client" (singular)', async () => {
        const single: RevenueReport = {
            ...MOCK_REVENUE,
            clients: [MOCK_REVENUE.clients[0]],
        }
        mockGetTopRevenue.mockResolvedValue(single)
        render(<TopRevenueClientsWidget />)

        await waitFor(() => {
            expect(screen.getByText('1 client')).toBeInTheDocument()
        })
    })
})
