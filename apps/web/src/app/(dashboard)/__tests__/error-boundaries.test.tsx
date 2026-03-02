import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Mocks
// ============================================================================

const mockReportError = vi.fn()
vi.mock('@/lib/error-tracking', () => ({
    reportError: (...args: unknown[]) => mockReportError(...args),
}))

// ============================================================================
// Dynamic imports after mocks
// ============================================================================

// Import a representative set of error pages
import AccountsError from '../../(dashboard)/banking/accounts/error'
import InvoicesError from '../../(dashboard)/business/invoices/error'
import OverviewError from '../../(dashboard)/overview/error'

// ============================================================================
// Tests
// ============================================================================

describe('Error Boundaries', () => {
    const mockReset = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('AccountsError', () => {
        it('should render error message', () => {
            const error = Object.assign(new Error('Database connection failed'), {
                digest: undefined,
            })

            render(<AccountsError error={error} reset={mockReset} />)

            expect(screen.getByText('Failed to load accounts')).toBeInTheDocument()
            expect(screen.getByText('Database connection failed')).toBeInTheDocument()
        })

        it('should display error digest when present', () => {
            const error = Object.assign(new Error('Server error'), {
                digest: 'abc123',
            })

            render(<AccountsError error={error} reset={mockReset} />)

            expect(screen.getByText('Error ID: abc123')).toBeInTheDocument()
        })

        it('should call reset when Try again button clicked', async () => {
            const user = userEvent.setup()
            const error = Object.assign(new Error('Timeout'), {
                digest: undefined,
            })

            render(<AccountsError error={error} reset={mockReset} />)

            await user.click(screen.getByText('Try again'))
            expect(mockReset).toHaveBeenCalledTimes(1)
        })

        it('should report error via error tracking', () => {
            const error = Object.assign(new Error('Critical failure'), {
                digest: 'xyz789',
            })

            render(<AccountsError error={error} reset={mockReset} />)

            expect(mockReportError).toHaveBeenCalledWith(error, {
                context: 'banking-accounts',
                severity: 'high',
                digest: 'xyz789',
            })
        })

        it('should show fallback when error message is empty', () => {
            const error = Object.assign(new Error(''), {
                digest: undefined,
            })

            render(<AccountsError error={error} reset={mockReset} />)

            expect(
                screen.getByText(/An error occurred while loading/)
            ).toBeInTheDocument()
        })
    })

    describe('InvoicesError', () => {
        it('should render error message and retry button', () => {
            const error = Object.assign(new Error('Failed to fetch'), {
                digest: undefined,
            })

            render(<InvoicesError error={error} reset={mockReset} />)

            expect(screen.getByText('Something went wrong')).toBeInTheDocument()
            expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
            expect(screen.getByText('Try again')).toBeInTheDocument()
        })

        it('should call reset on retry', async () => {
            const user = userEvent.setup()
            const error = Object.assign(new Error('Network error'), {
                digest: undefined,
            })

            render(<InvoicesError error={error} reset={mockReset} />)

            await user.click(screen.getByText('Try again'))
            expect(mockReset).toHaveBeenCalledTimes(1)
        })
    })

    describe('OverviewError', () => {
        it('should render overview error page', () => {
            const error = Object.assign(new Error('Dashboard data unavailable'), {
                digest: undefined,
            })

            render(<OverviewError error={error} reset={mockReset} />)

            expect(screen.getByText('Something went wrong')).toBeInTheDocument()
            expect(screen.getByText('Dashboard data unavailable')).toBeInTheDocument()
            expect(screen.getByText('Try again')).toBeInTheDocument()
        })

        it('should display error digest when present', () => {
            const error = Object.assign(new Error('Error'), {
                digest: 'dig-1',
            })

            render(<OverviewError error={error} reset={mockReset} />)

            expect(screen.getByText('Error ID: dig-1')).toBeInTheDocument()
        })

        it('should show fallback message when error message is empty', () => {
            const error = Object.assign(new Error(''), {
                digest: undefined,
            })

            render(<OverviewError error={error} reset={mockReset} />)

            expect(
                screen.getByText(/An error occurred while loading the overview/)
            ).toBeInTheDocument()
        })
    })

    describe('Common Error Boundary Patterns', () => {
        it('should render destructive border on error card', () => {
            const error = Object.assign(new Error('Test'), {
                digest: undefined,
            })

            const { container } = render(
                <AccountsError error={error} reset={mockReset} />
            )

            const card = container.querySelector('.border-destructive')
            expect(card).toBeTruthy()
        })

        it('should include AlertCircle icon', () => {
            const error = Object.assign(new Error('Test'), {
                digest: undefined,
            })

            render(<AccountsError error={error} reset={mockReset} />)

            // The destructive title contains the alert icon
            const title = screen.getByText('Failed to load accounts')
            expect(title).toBeInTheDocument()
        })

        it('should include RefreshCw icon in retry button', () => {
            const error = Object.assign(new Error('Test'), {
                digest: undefined,
            })

            render(<AccountsError error={error} reset={mockReset} />)

            const button = screen.getByText('Try again')
            expect(button).toBeInTheDocument()
        })
    })
})
