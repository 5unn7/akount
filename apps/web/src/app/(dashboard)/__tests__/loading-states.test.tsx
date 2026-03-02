import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

// ============================================================================
// Import a representative set of loading pages across all domains
// ============================================================================

import AccountsLoading from '../../(dashboard)/banking/accounts/loading'
import TransactionsLoading from '../../(dashboard)/banking/transactions/loading'
import TransfersLoading from '../../(dashboard)/banking/transfers/loading'
import CategoriesLoading from '../../(dashboard)/banking/categories/loading'
import InvoicesLoading from '../../(dashboard)/business/invoices/loading'
import BillsLoading from '../../(dashboard)/business/bills/loading'
import ClientsLoading from '../../(dashboard)/business/clients/loading'
import VendorsLoading from '../../(dashboard)/business/vendors/loading'
import PaymentsLoading from '../../(dashboard)/business/payments/loading'
import OverviewLoading from '../../(dashboard)/overview/loading'
import ChartOfAccountsLoading from '../../(dashboard)/accounting/chart-of-accounts/loading'
import JournalEntriesLoading from '../../(dashboard)/accounting/journal-entries/loading'
import TaxRatesLoading from '../../(dashboard)/accounting/tax-rates/loading'
import FiscalPeriodsLoading from '../../(dashboard)/accounting/fiscal-periods/loading'
import AssetsLoading from '../../(dashboard)/accounting/assets/loading'
import ReportsLoading from '../../(dashboard)/accounting/reports/loading'
import InsightsLoading from '../../(dashboard)/insights/loading'
import BudgetsLoading from '../../(dashboard)/planning/budgets/loading'
import ForecastsLoading from '../../(dashboard)/planning/forecasts/loading'
import GoalsLoading from '../../(dashboard)/planning/goals/loading'
import EntitiesLoading from '../../(dashboard)/system/entities/loading'
import SettingsLoading from '../../(dashboard)/system/settings/loading'
import UsersLoading from '../../(dashboard)/system/users/loading'
import AuditLogLoading from '../../(dashboard)/system/audit-log/loading'

// ============================================================================
// Tests
// ============================================================================

const LOADING_PAGES = [
    // Banking domain
    { name: 'AccountsLoading', Component: AccountsLoading, domain: 'banking' },
    { name: 'TransactionsLoading', Component: TransactionsLoading, domain: 'banking' },
    { name: 'TransfersLoading', Component: TransfersLoading, domain: 'banking' },
    { name: 'CategoriesLoading', Component: CategoriesLoading, domain: 'banking' },

    // Business domain
    { name: 'InvoicesLoading', Component: InvoicesLoading, domain: 'business' },
    { name: 'BillsLoading', Component: BillsLoading, domain: 'business' },
    { name: 'ClientsLoading', Component: ClientsLoading, domain: 'business' },
    { name: 'VendorsLoading', Component: VendorsLoading, domain: 'business' },
    { name: 'PaymentsLoading', Component: PaymentsLoading, domain: 'business' },

    // Overview
    { name: 'OverviewLoading', Component: OverviewLoading, domain: 'overview' },

    // Accounting domain
    { name: 'ChartOfAccountsLoading', Component: ChartOfAccountsLoading, domain: 'accounting' },
    { name: 'JournalEntriesLoading', Component: JournalEntriesLoading, domain: 'accounting' },
    { name: 'TaxRatesLoading', Component: TaxRatesLoading, domain: 'accounting' },
    { name: 'FiscalPeriodsLoading', Component: FiscalPeriodsLoading, domain: 'accounting' },
    { name: 'AssetsLoading', Component: AssetsLoading, domain: 'accounting' },
    { name: 'ReportsLoading', Component: ReportsLoading, domain: 'accounting' },

    // Insights domain
    { name: 'InsightsLoading', Component: InsightsLoading, domain: 'insights' },

    // Planning domain
    { name: 'BudgetsLoading', Component: BudgetsLoading, domain: 'planning' },
    { name: 'ForecastsLoading', Component: ForecastsLoading, domain: 'planning' },
    { name: 'GoalsLoading', Component: GoalsLoading, domain: 'planning' },

    // System domain
    { name: 'EntitiesLoading', Component: EntitiesLoading, domain: 'system' },
    { name: 'SettingsLoading', Component: SettingsLoading, domain: 'system' },
    { name: 'UsersLoading', Component: UsersLoading, domain: 'system' },
    { name: 'AuditLogLoading', Component: AuditLogLoading, domain: 'system' },
] as const

describe('Loading States (Invariant #6)', () => {
    describe.each(LOADING_PAGES)('$name', ({ Component }) => {
        it('renders without crashing', () => {
            const { container } = render(<Component />)
            expect(container.firstChild).toBeTruthy()
        })

        it('renders Skeleton components (animate-pulse)', () => {
            const { container } = render(<Component />)
            const skeletons = container.querySelectorAll('.animate-pulse')
            expect(skeletons.length).toBeGreaterThan(0)
        })

        it('uses proper container structure', () => {
            const { container } = render(<Component />)
            // Loading pages use either glass containers or space-y layout divs
            const glassElements = container.querySelectorAll('[class*="glass"]')
            const spaceElements = container.querySelectorAll('[class*="space-y"]')
            expect(glassElements.length + spaceElements.length).toBeGreaterThan(0)
        })
    })

    describe('Domain coverage', () => {
        const domains = LOADING_PAGES.map((p) => p.domain)
        const uniqueDomains = [...new Set(domains)]

        it('covers all 7 dashboard domains', () => {
            expect(uniqueDomains).toContain('banking')
            expect(uniqueDomains).toContain('business')
            expect(uniqueDomains).toContain('overview')
            expect(uniqueDomains).toContain('accounting')
            expect(uniqueDomains).toContain('insights')
            expect(uniqueDomains).toContain('planning')
            expect(uniqueDomains).toContain('system')
        })

        it('tests at least 24 loading pages', () => {
            expect(LOADING_PAGES.length).toBeGreaterThanOrEqual(24)
        })
    })

    describe('Skeleton structure patterns', () => {
        it('AccountsLoading renders account card grid', () => {
            const { container } = render(<AccountsLoading />)
            // Should have a grid of skeleton account cards
            const grids = container.querySelectorAll('[class*="grid"]')
            expect(grids.length).toBeGreaterThan(0)
        })

        it('OverviewLoading renders multiple layout rows', () => {
            const { container } = render(<OverviewLoading />)
            // Overview has 5+ rows of skeleton content
            const skeletons = container.querySelectorAll('.animate-pulse')
            expect(skeletons.length).toBeGreaterThan(20)
        })

        it('InvoicesLoading renders stats and table skeletons', () => {
            const { container } = render(<InvoicesLoading />)
            // Should have stats row + table rows
            const roundedElements = container.querySelectorAll('[class*="rounded"]')
            expect(roundedElements.length).toBeGreaterThan(5)
        })
    })
})
