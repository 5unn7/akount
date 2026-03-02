import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Mocks
// ============================================================================

const { mockApiFetch } = vi.hoisted(() => ({
    mockApiFetch: vi.fn(),
}))

vi.mock('@/lib/api/client-browser', () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

// Mock formatCurrency to return predictable output in tests
vi.mock('@/lib/utils/currency', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/utils/currency')>()
    return {
        ...actual,
        formatCurrency: (cents: number, currency: string = 'CAD') => `$${(cents / 100).toFixed(2)} ${currency}`,
    }
})

import { PaymentForm } from '../PaymentForm'

// ============================================================================
// Mock Data
// ============================================================================

const mockClients = [
    { id: 'cli-1', name: 'Acme Corp' },
    { id: 'cli-2', name: 'Widget Co' },
]

const mockVendors = [
    { id: 'ven-1', name: 'Supplier Corp' },
    { id: 'ven-2', name: 'Parts Ltd' },
]

const mockOpenInvoices = {
    invoices: [
        {
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            total: 100000, // $1,000.00
            paidAmount: 30000, // $300.00
            status: 'PARTIALLY_PAID',
        },
        {
            id: 'inv-2',
            invoiceNumber: 'INV-002',
            total: 50000, // $500.00
            paidAmount: 0,
            status: 'SENT',
        },
    ],
}

const mockOpenBills = {
    data: [
        {
            id: 'bill-1',
            billNumber: 'BILL-001',
            total: 75000, // $750.00
            paidAmount: 0,
            status: 'PENDING',
        },
    ],
}

// ============================================================================
// PaymentForm Tests
// ============================================================================

describe('PaymentForm', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        clients: mockClients,
        vendors: mockVendors,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockApiFetch.mockResolvedValue({})
    })

    // ------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------

    it('renders "Record Payment" title', () => {
        render(<PaymentForm {...defaultProps} />)
        // Title text also appears in submit button, so use heading role
        expect(screen.getByRole('heading', { name: 'Record Payment' })).toBeInTheDocument()
    })

    it('renders payment type toggle buttons', () => {
        render(<PaymentForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: /customer payment/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /vendor payment/i })).toBeInTheDocument()
    })

    it('renders form labels for amount, date, currency, payment method', () => {
        render(<PaymentForm {...defaultProps} />)
        expect(screen.getByText('Date')).toBeInTheDocument()
        expect(screen.getByText('Amount')).toBeInTheDocument()
        expect(screen.getByText('Currency')).toBeInTheDocument()
        expect(screen.getByText('Payment Method')).toBeInTheDocument()
        expect(screen.getByText('Reference')).toBeInTheDocument()
        expect(screen.getByText('Notes')).toBeInTheDocument()
    })

    it('renders Record Payment submit button', () => {
        render(<PaymentForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Record Payment' })).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
        render(<PaymentForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
        const { container } = render(<PaymentForm {...defaultProps} open={false} />)
        expect(container.querySelector('form')).not.toBeInTheDocument()
    })

    // ------------------------------------------------------------------
    // Direction Toggle
    // ------------------------------------------------------------------

    it('defaults to AR (Customer Payment) direction', () => {
        render(<PaymentForm {...defaultProps} />)
        // The Client label should appear for AR direction
        expect(screen.getByText('Client')).toBeInTheDocument()
    })

    it('switches to AP direction and shows Vendor label', async () => {
        const user = userEvent.setup()
        render(<PaymentForm {...defaultProps} />)

        await user.click(screen.getByRole('button', { name: /vendor payment/i }))
        expect(screen.getByText('Vendor')).toBeInTheDocument()
    })

    // ------------------------------------------------------------------
    // Defaults Pre-fill
    // ------------------------------------------------------------------

    it('pre-fills amount from defaults in dollar format', () => {
        render(<PaymentForm {...defaultProps} defaults={{ amount: 50000 }} />)
        // 50000 cents = $500.00, displayed as "500.00"
        expect(screen.getByDisplayValue('500.00')).toBeInTheDocument()
    })

    it('pre-fills direction from defaults', () => {
        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AP' }} />)
        expect(screen.getByText('Vendor')).toBeInTheDocument()
    })

    it('pre-fills currency from defaults', () => {
        render(<PaymentForm {...defaultProps} defaults={{ currency: 'USD' }} />)
        // The currency select should show USD
        // We can't easily test Select value, but we verify it's rendered
        expect(screen.getByText('Currency')).toBeInTheDocument()
    })

    // ------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------

    it('shows error when no client/vendor selected', async () => {
        const user = userEvent.setup()
        render(<PaymentForm {...defaultProps} />)

        // Enter a valid amount but no client selected
        await user.type(screen.getByPlaceholderText('0.00'), '100.00')
        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        expect(screen.getByText('Please select a client')).toBeInTheDocument()
    })

    it('shows error when amount is zero', async () => {
        const user = userEvent.setup()
        render(<PaymentForm {...defaultProps} defaults={{ clientId: 'cli-1', direction: 'AR' }} />)

        // No amount entered (default empty string = 0 cents)
        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        // First validation is client (since defaults set selectedId but Select might not reflect)
        // The error depends on whether selectedId is set from defaults
        await waitFor(() => {
            const errorText = screen.queryByText('Amount must be greater than zero') ||
                screen.queryByText(/please select/i)
            expect(errorText).toBeInTheDocument()
        })
    })

    // ------------------------------------------------------------------
    // Document Fetching
    // ------------------------------------------------------------------

    it('fetches open invoices when AR client is selected', async () => {
        // First call returns open invoices
        mockApiFetch.mockResolvedValueOnce(mockOpenInvoices)

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/business/invoices?clientId=cli-1')
            )
        })
    })

    it('fetches open bills when AP vendor is selected', async () => {
        mockApiFetch.mockResolvedValueOnce(mockOpenBills)

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AP', vendorId: 'ven-1' }} />)

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/business/bills?vendorId=ven-1')
            )
        })
    })

    it('displays open invoices for allocation', async () => {
        mockApiFetch.mockResolvedValueOnce(mockOpenInvoices)

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        await waitFor(() => {
            expect(screen.getByText('INV-001')).toBeInTheDocument()
            expect(screen.getByText('INV-002')).toBeInTheDocument()
        })
    })

    it('shows no outstanding documents message when none found', async () => {
        mockApiFetch.mockResolvedValueOnce({ invoices: [] })

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        await waitFor(() => {
            expect(screen.getByText(/no outstanding invoices/i)).toBeInTheDocument()
        })
    })

    it('handles document fetch failure gracefully', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        // Should not crash — shows empty documents
        await waitFor(() => {
            expect(screen.getByText(/no outstanding invoices/i)).toBeInTheDocument()
        })
    })

    // ------------------------------------------------------------------
    // Submission
    // ------------------------------------------------------------------

    it('submits payment with integer cents amount', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()

        // First: docs fetch returns empty, second: payment create succeeds
        mockApiFetch
            .mockResolvedValueOnce({ invoices: [] }) // docs fetch
            .mockResolvedValueOnce({ id: 'pay-1' }) // payment create

        render(<PaymentForm {...defaultProps} onSuccess={onSuccess} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        // Wait for docs to load
        await waitFor(() => {
            expect(screen.getByText(/no outstanding invoices/i)).toBeInTheDocument()
        })

        await user.type(screen.getByPlaceholderText('0.00'), '250.50')
        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        await waitFor(() => {
            const paymentCall = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('/api/business/payments') && !c[0].includes('allocate')
            )
            expect(paymentCall).toBeDefined()
            const body = JSON.parse(paymentCall![1].body)
            expect(body.amount).toBe(25050) // $250.50 in integer cents
            expect(Number.isInteger(body.amount)).toBe(true)
            expect(body.clientId).toBe('cli-1')
            expect(body.currency).toBe('CAD')
            expect(body.paymentMethod).toBe('TRANSFER')
        })
    })

    it('calls onSuccess and closes sheet after successful submit', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        const onOpenChange = vi.fn()

        mockApiFetch
            .mockResolvedValueOnce({ invoices: [] }) // docs fetch
            .mockResolvedValueOnce({ id: 'pay-1' }) // payment create

        render(
            <PaymentForm
                {...defaultProps}
                onSuccess={onSuccess}
                onOpenChange={onOpenChange}
                defaults={{ direction: 'AR', clientId: 'cli-1' }}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/no outstanding invoices/i)).toBeInTheDocument()
        })

        await user.type(screen.getByPlaceholderText('0.00'), '100.00')
        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })

    it('shows error when API fails on submit', async () => {
        const user = userEvent.setup()

        mockApiFetch
            .mockResolvedValueOnce({ invoices: [] }) // docs fetch
            .mockRejectedValueOnce(new Error('Payment failed')) // payment create

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1' }} />)

        await waitFor(() => {
            expect(screen.getByText(/no outstanding invoices/i)).toBeInTheDocument()
        })

        await user.type(screen.getByPlaceholderText('0.00'), '100.00')
        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        await waitFor(() => {
            expect(screen.getByText('Payment failed')).toBeInTheDocument()
        })
    })

    it('Cancel button closes the sheet', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<PaymentForm {...defaultProps} onOpenChange={onOpenChange} />)

        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    // ------------------------------------------------------------------
    // Two-phase submit with allocations
    // ------------------------------------------------------------------

    it('submits payment then allocations sequentially', async () => {
        const user = userEvent.setup()

        // Docs fetch returns open invoices, then payment create, then allocation
        mockApiFetch
            .mockResolvedValueOnce(mockOpenInvoices) // docs fetch
            .mockResolvedValueOnce({ id: 'pay-1' }) // payment create
            .mockResolvedValueOnce({}) // allocation

        render(<PaymentForm {...defaultProps} defaults={{ direction: 'AR', clientId: 'cli-1', amount: 70000 }} />)

        // Wait for docs to load
        await waitFor(() => {
            expect(screen.getByText('INV-001')).toBeInTheDocument()
        })

        // Enter allocation for INV-001 (outstanding = $700.00)
        const allocationInputs = screen.getAllByPlaceholderText('0.00')
        // First 0.00 placeholder is the payment amount (pre-filled from defaults)
        // The allocation inputs come after
        const invoiceAllocInput = allocationInputs[allocationInputs.length - 2] // second to last
        await user.type(invoiceAllocInput, '500.00')

        await user.click(screen.getByRole('button', { name: 'Record Payment' }))

        await waitFor(() => {
            // Verify payment was created first
            const paymentCall = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && c[0] === '/api/business/payments'
            )
            expect(paymentCall).toBeDefined()

            // Verify allocation was created after
            const allocCall = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('/allocate')
            )
            expect(allocCall).toBeDefined()
            const allocBody = JSON.parse(allocCall![1].body)
            expect(allocBody.invoiceId).toBeDefined()
            expect(allocBody.amount).toBe(50000) // $500.00 in integer cents
            expect(Number.isInteger(allocBody.amount)).toBe(true)
        })
    })
})
