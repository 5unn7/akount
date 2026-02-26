import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Mocks
// ============================================================================

const { mockPathname } = vi.hoisted(() => ({
    mockPathname: vi.fn(() => '/overview'),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => mockPathname(),
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

import { DomainTabs } from '../DomainTabs'
import { ContentPanel } from '../ContentPanel'
import { PageHeader } from '../PageHeader'
import {
    getDomainTabs,
    getNavigationForRole,
    navigationDomains,
} from '@/lib/navigation'
import type { Role } from '@akount/types'

// ============================================================================
// getDomainTabs (pure utility)
// ============================================================================

describe('getDomainTabs', () => {
    it('returns tabs for a valid domain', () => {
        const tabs = getDomainTabs('banking')
        expect(tabs.length).toBeGreaterThan(0)
        expect(tabs[0].label).toBe('Accounts')
        expect(tabs[0].href).toBe('/banking/accounts')
    })

    it('returns empty array for unknown domain', () => {
        expect(getDomainTabs('nonexistent')).toEqual([])
    })

    it('filters out sub-page items for accounting', () => {
        const tabs = getDomainTabs('accounting')
        const hrefs = tabs.map((t) => t.href)
        // Should include /accounting, /accounting/chart-of-accounts, etc.
        expect(hrefs).toContain('/accounting')
        expect(hrefs).toContain('/accounting/chart-of-accounts')
        // Should NOT include sub-pages like /accounting/reports/balance-sheet
        expect(hrefs).not.toContain('/accounting/reports/balance-sheet')
        expect(hrefs).not.toContain('/accounting/reports/profit-loss')
        expect(hrefs).not.toContain('/accounting/reports/trial-balance')
    })

    it('returns overview domain tabs', () => {
        const tabs = getDomainTabs('overview')
        expect(tabs.length).toBeGreaterThan(0)
        expect(tabs[0].href).toBe('/overview')
    })

    it('returns business domain tabs', () => {
        const tabs = getDomainTabs('business')
        const labels = tabs.map((t) => t.label)
        expect(labels).toContain('Clients')
        expect(labels).toContain('Vendors')
        expect(labels).toContain('Invoices')
        expect(labels).toContain('Bills')
        expect(labels).toContain('Payments')
    })

    it('each tab has label and href', () => {
        const tabs = getDomainTabs('banking')
        for (const tab of tabs) {
            expect(tab.label).toBeTruthy()
            expect(tab.href).toMatch(/^\//)
        }
    })
})

// ============================================================================
// getNavigationForRole
// ============================================================================

describe('getNavigationForRole', () => {
    it('OWNER sees all 8 domains', () => {
        const domains = getNavigationForRole('OWNER' as Role)
        expect(domains.length).toBe(8)
    })

    it('BOOKKEEPER sees limited domains (no Planning, Insights, Services)', () => {
        const domains = getNavigationForRole('BOOKKEEPER' as Role)
        const ids = domains.map((d) => d.id)
        expect(ids).toContain('overview')
        expect(ids).toContain('banking')
        expect(ids).toContain('business')
        expect(ids).not.toContain('planning')
        expect(ids).not.toContain('insights')
        expect(ids).not.toContain('services')
    })

    it('filters items within domains by role', () => {
        const domains = getNavigationForRole('BOOKKEEPER' as Role)
        const banking = domains.find((d) => d.id === 'banking')
        const bankingHrefs = banking?.items.map((i) => i.href) ?? []
        // BOOKKEEPER should NOT see Transfers (OWNER, ADMIN, ACCOUNTANT only)
        expect(bankingHrefs).not.toContain('/banking/transfers')
        // BOOKKEEPER should see Accounts, Transactions, Reconciliation, Imports
        expect(bankingHrefs).toContain('/banking/accounts')
        expect(bankingHrefs).toContain('/banking/transactions')
    })

    it('ADMIN sees all 8 domains', () => {
        const domains = getNavigationForRole('ADMIN' as Role)
        expect(domains.length).toBe(8)
    })

    it('returns empty domains when role has no items', () => {
        // All domains with roles should filter properly
        const domains = getNavigationForRole('INVESTOR' as Role)
        // INVESTOR should see overview, planning, accounting(reports only)
        const ids = domains.map((d) => d.id)
        expect(ids).toContain('overview')
        // Should not see banking, business, services
        expect(ids).not.toContain('banking')
        expect(ids).not.toContain('business')
    })
})

// ============================================================================
// navigationDomains structure
// ============================================================================

describe('navigationDomains', () => {
    it('has exactly 8 domains', () => {
        expect(navigationDomains).toHaveLength(8)
    })

    it('each domain has required fields', () => {
        for (const domain of navigationDomains) {
            expect(domain.id).toBeTruthy()
            expect(domain.label).toBeTruthy()
            expect(domain.icon).toBeDefined()
            expect(domain.items.length).toBeGreaterThan(0)
        }
    })

    it('each nav item has label, icon, href', () => {
        for (const domain of navigationDomains) {
            for (const item of domain.items) {
                expect(item.label).toBeTruthy()
                expect(item.icon).toBeDefined()
                expect(item.href).toMatch(/^\//)
            }
        }
    })

    it('all hrefs are unique across all domains', () => {
        const hrefs = navigationDomains.flatMap((d) =>
            d.items.map((i) => i.href)
        )
        const unique = new Set(hrefs)
        expect(unique.size).toBe(hrefs.length)
    })
})

// ============================================================================
// DomainTabs Component
// ============================================================================

describe('DomainTabs', () => {
    beforeEach(() => {
        mockPathname.mockReturnValue('/banking/accounts')
    })

    it('renders tabs when explicit tabs provided', () => {
        const tabs = [
            { label: 'Tab A', href: '/a' },
            { label: 'Tab B', href: '/b' },
        ]
        render(<DomainTabs tabs={tabs} />)
        expect(screen.getByText('Tab A')).toBeInTheDocument()
        expect(screen.getByText('Tab B')).toBeInTheDocument()
    })

    it('renders correct hrefs', () => {
        const tabs = [
            { label: 'Accounts', href: '/banking/accounts' },
            { label: 'Transactions', href: '/banking/transactions' },
        ]
        render(<DomainTabs tabs={tabs} />)
        expect(screen.getByText('Accounts').closest('a')).toHaveAttribute('href', '/banking/accounts')
        expect(screen.getByText('Transactions').closest('a')).toHaveAttribute('href', '/banking/transactions')
    })

    it('highlights the active tab based on pathname', () => {
        mockPathname.mockReturnValue('/banking/accounts')
        const tabs = [
            { label: 'Accounts', href: '/banking/accounts' },
            { label: 'Transactions', href: '/banking/transactions' },
        ]
        render(<DomainTabs tabs={tabs} />)
        const activeLink = screen.getByText('Accounts').closest('a')
        expect(activeLink?.className).toContain('bg-ak-bg-4')
        const inactiveLink = screen.getByText('Transactions').closest('a')
        expect(inactiveLink?.className).not.toContain('bg-ak-bg-4')
    })

    it('highlights tab when on a sub-page', () => {
        mockPathname.mockReturnValue('/banking/transactions/txn-123')
        const tabs = [
            { label: 'Accounts', href: '/banking/accounts' },
            { label: 'Transactions', href: '/banking/transactions' },
        ]
        render(<DomainTabs tabs={tabs} />)
        const activeLink = screen.getByText('Transactions').closest('a')
        expect(activeLink?.className).toContain('bg-ak-bg-4')
    })

    it('auto-detects domain from pathname when no tabs provided', () => {
        mockPathname.mockReturnValue('/business/invoices')
        render(<DomainTabs />)
        expect(screen.getByText('Clients')).toBeInTheDocument()
        expect(screen.getByText('Invoices')).toBeInTheDocument()
    })

    it('renders nothing when domain has no tabs', () => {
        mockPathname.mockReturnValue('/unknown-domain')
        const { container } = render(<DomainTabs />)
        expect(container.innerHTML).toBe('')
    })

    it('renders nothing for empty tabs array', () => {
        const { container } = render(<DomainTabs tabs={[]} />)
        expect(container.innerHTML).toBe('')
    })

    it('applies custom className', () => {
        const tabs = [{ label: 'Test', href: '/test' }]
        const { container } = render(<DomainTabs tabs={tabs} className="my-custom-class" />)
        expect(container.firstChild).toHaveClass('my-custom-class')
    })
})

// ============================================================================
// ContentPanel
// ============================================================================

describe('ContentPanel', () => {
    it('renders children', () => {
        render(<ContentPanel><span>Hello Panel</span></ContentPanel>)
        expect(screen.getByText('Hello Panel')).toBeInTheDocument()
    })

    it('applies glass styling', () => {
        const { container } = render(<ContentPanel>Content</ContentPanel>)
        expect(container.firstChild).toHaveClass('glass')
    })

    it('applies custom className', () => {
        const { container } = render(
            <ContentPanel className="extra-class">Content</ContentPanel>
        )
        expect(container.firstChild).toHaveClass('extra-class')
        expect(container.firstChild).toHaveClass('glass')
    })
})

// ============================================================================
// PageHeader
// ============================================================================

describe('PageHeader', () => {
    it('renders title', () => {
        render(<PageHeader title="My Page" />)
        expect(screen.getByText('My Page')).toBeInTheDocument()
    })

    it('renders subtitle', () => {
        render(<PageHeader title="Title" subtitle="A description" />)
        expect(screen.getByText('A description')).toBeInTheDocument()
    })

    it('renders actions slot', () => {
        render(
            <PageHeader
                title="Title"
                actions={<button>Create</button>}
            />
        )
        expect(screen.getByText('Create')).toBeInTheDocument()
    })

    it('renders breadcrumbs', () => {
        render(
            <PageHeader
                breadcrumbs={[
                    { label: 'Banking', href: '/banking' },
                    { label: 'Account List' },
                ]}
                title="Account List"
            />
        )
        expect(screen.getByText('Banking')).toBeInTheDocument()
        // Breadcrumb page + title both say "Account List"
        expect(screen.getAllByText('Account List').length).toBeGreaterThanOrEqual(1)
    })

    it('last breadcrumb is not a link', () => {
        render(
            <PageHeader
                breadcrumbs={[
                    { label: 'Banking', href: '/banking' },
                    { label: 'Current Page' },
                ]}
            />
        )
        // First crumb should be a link
        const bankingLink = screen.getByText('Banking').closest('a')
        expect(bankingLink).toHaveAttribute('href', '/banking')
        // Last crumb should not be a link
        const currentPage = screen.getByText('Current Page')
        expect(currentPage.closest('a')).toBeNull()
    })

    it('renders without breadcrumbs', () => {
        render(<PageHeader title="No Crumbs" />)
        expect(screen.getByText('No Crumbs')).toBeInTheDocument()
    })

    it('renders without title', () => {
        render(<PageHeader subtitle="Just subtitle" />)
        expect(screen.getByText('Just subtitle')).toBeInTheDocument()
    })

    it('renders without any props (no crash)', () => {
        const { container } = render(<PageHeader />)
        expect(container.firstChild).toBeInTheDocument()
    })
})
