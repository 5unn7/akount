import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Mocks
// ============================================================================

const { mockPush } = vi.hoisted(() => ({
    mockPush: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/overview',
    useSearchParams: () => new URLSearchParams(),
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

import { StatCard } from '../StatCard'
import { QuickStats } from '../QuickStats'
import { QuickActionPills } from '../QuickActionPills'
import type { StatCardData } from '@/lib/dashboard/constants'

// ============================================================================
// StatCard
// ============================================================================

describe('StatCard', () => {
    beforeEach(() => {
        mockPush.mockClear()
    })

    const baseStat: StatCardData = {
        label: 'Revenue',
        value: '$12,500.00',
    }

    it('renders label and value', () => {
        render(<StatCard stat={baseStat} index={0} />)
        expect(screen.getByText('Revenue')).toBeInTheDocument()
        expect(screen.getByText('$12,500.00')).toBeInTheDocument()
    })

    it('renders up trend icon and text', () => {
        const stat: StatCardData = {
            ...baseStat,
            trend: { direction: 'up', text: '+12% vs last month' },
        }
        render(<StatCard stat={stat} index={0} />)
        expect(screen.getByText('+12% vs last month')).toBeInTheDocument()
    })

    it('renders down trend icon and text', () => {
        const stat: StatCardData = {
            ...baseStat,
            trend: { direction: 'down', text: '-5% vs last month' },
        }
        render(<StatCard stat={stat} index={0} />)
        expect(screen.getByText('-5% vs last month')).toBeInTheDocument()
    })

    it('renders flat trend', () => {
        const stat: StatCardData = {
            ...baseStat,
            trend: { direction: 'flat', text: 'No change' },
        }
        render(<StatCard stat={stat} index={0} />)
        expect(screen.getByText('No change')).toBeInTheDocument()
    })

    it('does not render trend text when no trend provided', () => {
        render(<StatCard stat={baseStat} index={0} />)
        expect(
            screen.queryByText(/vs last month/)
        ).not.toBeInTheDocument()
    })

    it('has role="link" when href provided', () => {
        const stat: StatCardData = {
            ...baseStat,
            href: '/banking/accounts',
        }
        render(<StatCard stat={stat} index={0} />)
        expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('has no role="link" when no href', () => {
        render(<StatCard stat={baseStat} index={0} />)
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('navigates on click when href provided', async () => {
        const user = userEvent.setup()
        const stat: StatCardData = {
            ...baseStat,
            href: '/banking/accounts',
        }
        render(<StatCard stat={stat} index={0} />)
        await user.click(screen.getByRole('link'))
        expect(mockPush).toHaveBeenCalledWith('/banking/accounts')
    })

    it('does not navigate on click when no href', async () => {
        const user = userEvent.setup()
        render(<StatCard stat={baseStat} index={0} />)
        await user.click(screen.getByText('Revenue'))
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('renders sparkline SVG when data has >1 points', () => {
        const stat: StatCardData = {
            ...baseStat,
            sparkline: [100, 200, 150, 300],
            color: 'green',
        }
        const { container } = render(<StatCard stat={stat} index={0} />)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('does not render sparkline when data has <=1 points', () => {
        const stat: StatCardData = {
            ...baseStat,
            sparkline: [100],
        }
        const { container } = render(<StatCard stat={stat} index={0} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })

    it('does not render sparkline when no sparkline data', () => {
        const { container } = render(<StatCard stat={baseStat} index={0} />)
        expect(container.querySelector('svg')).not.toBeInTheDocument()
    })

    it('applies color class to value text', () => {
        const stat: StatCardData = {
            ...baseStat,
            color: 'green',
        }
        render(<StatCard stat={stat} index={0} />)
        const valueEl = screen.getByText('$12,500.00')
        expect(valueEl.className).toContain('text-ak-green')
    })

    it('applies highlighted border class', () => {
        const { container } = render(
            <StatCard stat={baseStat} index={0} highlighted />
        )
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('border-ak-border-3')
    })

    it('does not apply highlighted border by default', () => {
        const { container } = render(
            <StatCard stat={baseStat} index={0} />
        )
        const card = container.firstChild as HTMLElement
        expect(card.className).not.toContain('border-ak-border-3')
    })

    it('applies cursor-pointer when href provided', () => {
        const stat: StatCardData = {
            ...baseStat,
            href: '/banking/accounts',
        }
        const { container } = render(<StatCard stat={stat} index={0} />)
        const card = container.firstChild as HTMLElement
        expect(card.className).toContain('cursor-pointer')
    })
})

// ============================================================================
// QuickStats
// ============================================================================

describe('QuickStats', () => {
    it('renders "Quick Stats" heading', () => {
        render(<QuickStats />)
        expect(screen.getByText('Quick Stats')).toBeInTheDocument()
    })

    it('shows empty state when stats is undefined', () => {
        render(<QuickStats />)
        expect(
            screen.getByText('Stats appear as you add data')
        ).toBeInTheDocument()
    })

    it('shows empty state when stats is empty array', () => {
        render(<QuickStats stats={[]} />)
        expect(
            screen.getByText('Stats appear as you add data')
        ).toBeInTheDocument()
    })

    it('renders stat rows with labels and values', () => {
        const stats = [
            { label: 'Total Revenue', value: '$25,000' },
            { label: 'Total Expenses', value: '$12,000' },
        ]
        render(<QuickStats stats={stats} />)
        expect(screen.getByText('Total Revenue')).toBeInTheDocument()
        expect(screen.getByText('$25,000')).toBeInTheDocument()
        expect(screen.getByText('Total Expenses')).toBeInTheDocument()
        expect(screen.getByText('$12,000')).toBeInTheDocument()
    })

    it('renders correct number of stat rows', () => {
        const stats = [
            { label: 'Metric 1', value: '100' },
            { label: 'Metric 2', value: '200' },
            { label: 'Metric 3', value: '300' },
        ]
        render(<QuickStats stats={stats} />)
        // Each row has label + value, we can count by label presence
        expect(screen.getByText('Metric 1')).toBeInTheDocument()
        expect(screen.getByText('Metric 2')).toBeInTheDocument()
        expect(screen.getByText('Metric 3')).toBeInTheDocument()
    })

    it('hides empty state when stats are provided', () => {
        const stats = [{ label: 'Revenue', value: '$10,000' }]
        render(<QuickStats stats={stats} />)
        expect(
            screen.queryByText('Stats appear as you add data')
        ).not.toBeInTheDocument()
    })
})

// ============================================================================
// QuickActionPills
// ============================================================================

describe('QuickActionPills', () => {
    it('renders all 6 action pills', () => {
        render(<QuickActionPills />)
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(6)
    })

    it('renders correct labels', () => {
        render(<QuickActionPills />)
        expect(screen.getByText('Invoice')).toBeInTheDocument()
        expect(screen.getByText('New Bill')).toBeInTheDocument()
        expect(screen.getByText('Scan Receipt')).toBeInTheDocument()
        expect(screen.getByText('Record Payment')).toBeInTheDocument()
        expect(screen.getByText('Transfer')).toBeInTheDocument()
        expect(screen.getByText('Journal Entry')).toBeInTheDocument()
    })

    it('links to correct hrefs', () => {
        render(<QuickActionPills />)
        expect(screen.getByText('Invoice').closest('a')).toHaveAttribute(
            'href',
            '/business/invoices'
        )
        expect(screen.getByText('New Bill').closest('a')).toHaveAttribute(
            'href',
            '/business/bills'
        )
        expect(
            screen.getByText('Scan Receipt').closest('a')
        ).toHaveAttribute('href', '/banking/imports')
        expect(
            screen.getByText('Record Payment').closest('a')
        ).toHaveAttribute('href', '/business/payments')
        expect(screen.getByText('Transfer').closest('a')).toHaveAttribute(
            'href',
            '/banking/transfers'
        )
        expect(
            screen.getByText('Journal Entry').closest('a')
        ).toHaveAttribute('href', '/accounting/journal-entries')
    })

    it('each pill contains an icon', () => {
        const { container } = render(<QuickActionPills />)
        // Each action has an SVG icon (lucide-react renders as SVG)
        const svgs = container.querySelectorAll('svg')
        expect(svgs.length).toBe(6)
    })
})
