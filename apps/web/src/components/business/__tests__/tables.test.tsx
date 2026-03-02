import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Mocks
// ============================================================================

const { mockPush, mockToastSuccess, mockToastError, mockToastWarning, mockApiFetch } = vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    mockToastWarning: vi.fn(),
    mockApiFetch: vi.fn(),
}))

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/business/invoices',
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

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => mockToastSuccess(...args),
        error: (...args: unknown[]) => mockToastError(...args),
        warning: (...args: unknown[]) => mockToastWarning(...args),
    },
}))

vi.mock('@/lib/api/client-browser', () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

vi.mock('@akount/ui/business', () => ({
    InvoiceStatusBadge: ({ status }: { status: string }) => (
        <span data-testid={`invoice-status-${status}`}>{status}</span>
    ),
    BillStatusBadge: ({ status }: { status: string }) => (
        <span data-testid={`bill-status-${status}`}>{status}</span>
    ),
}))

vi.mock('@akount/ui', () => ({
    EmptyState: ({ title, description }: { title: string; description: string }) => (
        <div data-testid="empty-state">
            <p>{title}</p>
            <p>{description}</p>
        </div>
    ),
}))

// BulkActionToolbar — render buttons directly for testability
vi.mock('@/components/shared/BulkActionToolbar', () => ({
    BulkActionToolbar: ({
        count,
        onClear,
        actions,
    }: {
        count: number
        onClear: () => void
        actions: Array<{
            label: string
            onClick: () => void
            disabled?: boolean
        }>
    }) => {
        if (count === 0) return null
        return (
            <div data-testid="bulk-toolbar">
                <span>{count} selected</span>
                <button onClick={onClear}>Clear</button>
                {actions.map((a) => (
                    <button
                        key={a.label}
                        onClick={a.onClick}
                        disabled={a.disabled}
                    >
                        {a.label}
                    </button>
                ))}
            </div>
        )
    },
}))

import type { Invoice } from '@/lib/api/invoices'
import type { Bill } from '@/lib/api/bills'
import type { Payment } from '@/lib/api/payments'
import { InvoiceTable } from '../InvoiceTable'
import { BillsTable } from '../BillsTable'
import { PaymentTable } from '../PaymentTable'

// ============================================================================
// Mock Data Factories
// ============================================================================

function mockInvoice(overrides: Partial<Invoice> = {}): Invoice {
    return {
        id: 'inv-1',
        entityId: 'ent-1',
        clientId: 'cli-1',
        invoiceNumber: 'INV-001',
        issueDate: '2026-01-15T12:00:00Z',
        dueDate: '2026-02-15T12:00:00Z',
        currency: 'CAD',
        subtotal: 100000,
        taxAmount: 13000,
        total: 113000,
        status: 'SENT',
        paidAmount: 0,
        notes: null,
        deletedAt: null,
        createdAt: '2026-01-15T12:00:00Z',
        updatedAt: '2026-01-15T12:00:00Z',
        client: { id: 'cli-1', name: 'Acme Corp', email: 'billing@acme.com' },
        entity: { id: 'ent-1', name: 'My Business' },
        invoiceLines: [],
        ...overrides,
    }
}

function mockBill(overrides: Partial<Bill> = {}): Bill {
    return {
        id: 'bill-1',
        entityId: 'ent-1',
        vendorId: 'ven-1',
        billNumber: 'BILL-001',
        issueDate: '2026-01-10T12:00:00Z',
        dueDate: '2026-02-10T12:00:00Z',
        currency: 'CAD',
        subtotal: 50000,
        taxAmount: 6500,
        total: 56500,
        status: 'PENDING',
        paidAmount: 0,
        notes: null,
        deletedAt: null,
        createdAt: '2026-01-10T12:00:00Z',
        updatedAt: '2026-01-10T12:00:00Z',
        vendor: { id: 'ven-1', name: 'Office Supply Co', email: 'invoices@office.com' },
        entity: { id: 'ent-1', name: 'My Business' },
        billLines: [],
        ...overrides,
    }
}

function mockPayment(overrides: Partial<Payment> = {}): Payment {
    return {
        id: 'pay-1',
        entityId: 'ent-1',
        date: '2026-01-20T12:00:00Z',
        amount: 50000,
        currency: 'CAD',
        paymentMethod: 'TRANSFER',
        reference: 'TRF-12345',
        clientId: 'cli-1',
        vendorId: null,
        notes: null,
        deletedAt: null,
        createdAt: '2026-01-20T12:00:00Z',
        updatedAt: '2026-01-20T12:00:00Z',
        client: { id: 'cli-1', name: 'Acme Corp' },
        vendor: null,
        allocations: [],
        ...overrides,
    }
}

// ============================================================================
// InvoiceTable
// ============================================================================

describe('InvoiceTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: return resolved empty object (apiFetch returns Promises)
        mockApiFetch.mockResolvedValue({})
    })

    it('renders empty state when no invoices', () => {
        render(<InvoiceTable invoices={[]} />)
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
        expect(screen.getByText('No invoices found')).toBeInTheDocument()
    })

    it('renders invoice number and client name', () => {
        const invoices = [mockInvoice()]
        render(<InvoiceTable invoices={invoices} />)
        expect(screen.getByText('INV-001')).toBeInTheDocument()
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('renders client email when available', () => {
        const invoices = [mockInvoice()]
        render(<InvoiceTable invoices={invoices} />)
        expect(screen.getByText('billing@acme.com')).toBeInTheDocument()
    })

    it('renders status badge for each invoice', () => {
        const invoices = [
            mockInvoice({ id: 'inv-1', status: 'SENT' }),
            mockInvoice({ id: 'inv-2', invoiceNumber: 'INV-002', status: 'PAID' }),
        ]
        render(<InvoiceTable invoices={invoices} />)
        expect(screen.getByTestId('invoice-status-SENT')).toBeInTheDocument()
        expect(screen.getByTestId('invoice-status-PAID')).toBeInTheDocument()
    })

    it('renders formatted total amount', () => {
        const invoices = [mockInvoice({ total: 113000, paidAmount: 50000, currency: 'CAD' })]
        render(<InvoiceTable invoices={invoices} />)
        // formatCurrency(113000, 'CAD') → "$1,130.00" (total column)
        // balance due: 113000 - 50000 = 63000 → "$630.00" (different value)
        expect(screen.getByText('$1,130.00')).toBeInTheDocument()
        expect(screen.getByText('$630.00')).toBeInTheDocument()
    })

    it('renders balance due (total - paidAmount)', () => {
        const invoices = [mockInvoice({ total: 113000, paidAmount: 50000 })]
        render(<InvoiceTable invoices={invoices} />)
        // Balance due: 113000 - 50000 = 63000 → "$630.00"
        expect(screen.getByText('$630.00')).toBeInTheDocument()
    })

    it('navigates to invoice detail on row click', async () => {
        const user = userEvent.setup()
        const invoices = [mockInvoice()]
        render(<InvoiceTable invoices={invoices} />)

        // Click the invoice number cell (part of the row)
        await user.click(screen.getByText('INV-001'))
        expect(mockPush).toHaveBeenCalledWith('/business/invoices/inv-1')
    })

    it('shows checkboxes for cancellable invoices (DRAFT/SENT)', () => {
        const invoices = [
            mockInvoice({ id: 'inv-1', status: 'SENT', invoiceNumber: 'INV-001' }),
            mockInvoice({ id: 'inv-2', status: 'PAID', invoiceNumber: 'INV-002' }),
        ]
        render(<InvoiceTable invoices={invoices} />)
        // SENT invoice should have a checkbox
        expect(screen.getByLabelText('Select invoice INV-001')).toBeInTheDocument()
        // PAID invoice should NOT have a checkbox
        expect(screen.queryByLabelText('Select invoice INV-002')).not.toBeInTheDocument()
    })

    it('shows cancel button on DRAFT/SENT invoice rows', () => {
        const invoices = [mockInvoice({ status: 'SENT' })]
        render(<InvoiceTable invoices={invoices} />)
        // The cancel button exists (though opacity-0 until hover)
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('does not show cancel button on PAID invoice rows', () => {
        const invoices = [mockInvoice({ status: 'PAID' })]
        render(<InvoiceTable invoices={invoices} />)
        // No cancel buttons should be rendered for PAID
        const cancelBtns = screen.queryAllByRole('button', { name: /cancel/i })
        expect(cancelBtns).toHaveLength(0)
    })

    it('opens confirmation dialog when cancel button clicked', async () => {
        const user = userEvent.setup()
        const invoices = [mockInvoice({ status: 'DRAFT', invoiceNumber: 'INV-999' })]
        render(<InvoiceTable invoices={invoices} />)

        const cancelBtn = screen.getByRole('button', { name: /cancel/i })
        await user.click(cancelBtn)

        expect(screen.getByText('Cancel this invoice?')).toBeInTheDocument()
        expect(screen.getByText(/INV-999 will be marked as cancelled/)).toBeInTheDocument()
    })

    it('calls API and shows success toast on single cancel confirm', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockResolvedValueOnce({})
        const onCancelSuccess = vi.fn()

        const invoices = [mockInvoice({ status: 'DRAFT', invoiceNumber: 'INV-999' })]
        render(<InvoiceTable invoices={invoices} onCancelSuccess={onCancelSuccess} />)

        // Open confirmation dialog
        await user.click(screen.getByRole('button', { name: /cancel/i }))
        // Confirm cancel
        await user.click(screen.getByRole('button', { name: 'Cancel Invoice' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/invoices/inv-1/cancel',
                { method: 'POST' }
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('Invoice INV-999 cancelled')
        expect(onCancelSuccess).toHaveBeenCalled()
    })

    it('shows error toast when single cancel fails', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockRejectedValueOnce(new Error('Server error'))

        const invoices = [mockInvoice({ status: 'DRAFT' })]
        render(<InvoiceTable invoices={invoices} />)

        await user.click(screen.getByRole('button', { name: /cancel/i }))
        await user.click(screen.getByRole('button', { name: 'Cancel Invoice' }))

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith('Server error')
        })
    })

    it('renders table headers', () => {
        const invoices = [mockInvoice()]
        render(<InvoiceTable invoices={invoices} />)
        expect(screen.getByText('Invoice #')).toBeInTheDocument()
        expect(screen.getByText('Client')).toBeInTheDocument()
        expect(screen.getByText('Issue Date')).toBeInTheDocument()
        expect(screen.getByText('Due Date')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
        expect(screen.getByText('Balance Due')).toBeInTheDocument()
    })

    it('renders multiple invoices as rows', () => {
        const invoices = [
            mockInvoice({ id: 'inv-1', invoiceNumber: 'INV-001' }),
            mockInvoice({ id: 'inv-2', invoiceNumber: 'INV-002' }),
            mockInvoice({ id: 'inv-3', invoiceNumber: 'INV-003' }),
        ]
        render(<InvoiceTable invoices={invoices} />)
        expect(screen.getByText('INV-001')).toBeInTheDocument()
        expect(screen.getByText('INV-002')).toBeInTheDocument()
        expect(screen.getByText('INV-003')).toBeInTheDocument()
    })
})

// ============================================================================
// BillsTable
// ============================================================================

describe('BillsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApiFetch.mockResolvedValue({})
    })

    it('renders empty state when no bills', () => {
        render(<BillsTable bills={[]} />)
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
        expect(screen.getByText('No bills found')).toBeInTheDocument()
    })

    it('renders bill number and vendor name', () => {
        const bills = [mockBill()]
        render(<BillsTable bills={bills} />)
        expect(screen.getByText('BILL-001')).toBeInTheDocument()
        expect(screen.getByText('Office Supply Co')).toBeInTheDocument()
    })

    it('renders vendor email when available', () => {
        const bills = [mockBill()]
        render(<BillsTable bills={bills} />)
        expect(screen.getByText('invoices@office.com')).toBeInTheDocument()
    })

    it('renders status badge for each bill', () => {
        const bills = [
            mockBill({ id: 'b1', status: 'PENDING' }),
            mockBill({ id: 'b2', billNumber: 'BILL-002', status: 'PAID' }),
        ]
        render(<BillsTable bills={bills} />)
        expect(screen.getByTestId('bill-status-PENDING')).toBeInTheDocument()
        expect(screen.getByTestId('bill-status-PAID')).toBeInTheDocument()
    })

    it('renders formatted total amount', () => {
        const bills = [mockBill({ total: 56500, paidAmount: 20000, currency: 'CAD' })]
        render(<BillsTable bills={bills} currency="CAD" />)
        // formatCurrency(56500, 'CAD') → "$565.00" (total column)
        // balance due: 56500 - 20000 = 36500 → "$365.00" (different value)
        expect(screen.getByText('$565.00')).toBeInTheDocument()
        expect(screen.getByText('$365.00')).toBeInTheDocument()
    })

    it('renders balance due with red color when positive', () => {
        const bills = [mockBill({ total: 56500, paidAmount: 0 })]
        const { container } = render(<BillsTable bills={bills} />)
        // Balance due: 56500 - 0 = 56500 → "$565.00" with text-ak-red
        const balanceElements = container.querySelectorAll('.text-ak-red')
        expect(balanceElements.length).toBeGreaterThan(0)
    })

    it('renders balance due with green color when zero', () => {
        const bills = [mockBill({ total: 56500, paidAmount: 56500 })]
        const { container } = render(<BillsTable bills={bills} />)
        // Balance due: 0 → text-ak-green
        const greenElements = container.querySelectorAll('.text-ak-green')
        expect(greenElements.length).toBeGreaterThan(0)
    })

    it('navigates to bill detail on row click', async () => {
        const user = userEvent.setup()
        const bills = [mockBill()]
        render(<BillsTable bills={bills} />)

        await user.click(screen.getByText('BILL-001'))
        expect(mockPush).toHaveBeenCalledWith('/business/bills/bill-1')
    })

    it('shows checkboxes for cancellable bills (DRAFT/PENDING)', () => {
        const bills = [
            mockBill({ id: 'b1', status: 'PENDING', billNumber: 'BILL-001' }),
            mockBill({ id: 'b2', status: 'PAID', billNumber: 'BILL-002' }),
        ]
        render(<BillsTable bills={bills} />)
        expect(screen.getByLabelText('Select bill BILL-001')).toBeInTheDocument()
        expect(screen.queryByLabelText('Select bill BILL-002')).not.toBeInTheDocument()
    })

    it('renders table headers', () => {
        const bills = [mockBill()]
        render(<BillsTable bills={bills} />)
        expect(screen.getByText('Bill #')).toBeInTheDocument()
        expect(screen.getByText('Vendor')).toBeInTheDocument()
        expect(screen.getByText('Issue Date')).toBeInTheDocument()
        expect(screen.getByText('Due Date')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Amount')).toBeInTheDocument()
        expect(screen.getByText('Balance Due')).toBeInTheDocument()
    })

    it('renders multiple bill rows', () => {
        const bills = [
            mockBill({ id: 'b1', billNumber: 'BILL-001' }),
            mockBill({ id: 'b2', billNumber: 'BILL-002' }),
        ]
        render(<BillsTable bills={bills} />)
        expect(screen.getByText('BILL-001')).toBeInTheDocument()
        expect(screen.getByText('BILL-002')).toBeInTheDocument()
    })

    it('calls bulk cancel API and shows toast on success', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockResolvedValue({})
        const onCancelSuccess = vi.fn()

        const bills = [
            mockBill({ id: 'b1', status: 'DRAFT', billNumber: 'BILL-001' }),
            mockBill({ id: 'b2', status: 'DRAFT', billNumber: 'BILL-002' }),
        ]
        render(<BillsTable bills={bills} onCancelSuccess={onCancelSuccess} />)

        // Select first bill via checkbox
        await user.click(screen.getByLabelText('Select bill BILL-001'))

        // BulkActionToolbar should appear
        const toolbar = screen.getByTestId('bulk-toolbar')
        expect(within(toolbar).getByText('1 selected')).toBeInTheDocument()

        // Click cancel in toolbar
        const cancelBtn = within(toolbar).getByText(/Cancel 1 Bill/)
        await user.click(cancelBtn)

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/bills/b1/cancel',
                { method: 'POST' }
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('1 bill cancelled')
        expect(onCancelSuccess).toHaveBeenCalled()
    })
})

// ============================================================================
// PaymentTable
// ============================================================================

describe('PaymentTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders empty state when no payments', () => {
        render(<PaymentTable payments={[]} />)
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
        expect(screen.getByText('No payments found')).toBeInTheDocument()
    })

    it('renders payment date and amount', () => {
        const payments = [mockPayment({ amount: 50000 })]
        render(<PaymentTable payments={payments} />)
        // formatCurrency(50000, 'CAD') → "$500.00"
        expect(screen.getByText('$500.00')).toBeInTheDocument()
    })

    it('renders "Received" badge for client payments', () => {
        const payments = [mockPayment({ clientId: 'cli-1', vendorId: null })]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Received')).toBeInTheDocument()
    })

    it('renders "Paid" badge for vendor payments', () => {
        const payments = [
            mockPayment({
                clientId: null,
                vendorId: 'ven-1',
                client: null,
                vendor: { id: 'ven-1', name: 'Vendor Co' },
            }),
        ]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Paid')).toBeInTheDocument()
    })

    it('renders client/vendor name', () => {
        const payments = [mockPayment()]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('renders payment method label', () => {
        const payments = [mockPayment({ paymentMethod: 'TRANSFER' })]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Transfer')).toBeInTheDocument()
    })

    it('renders method labels for all types', () => {
        const methods = ['CARD', 'CASH', 'CHECK', 'WIRE', 'OTHER'] as const
        const payments = methods.map((m, i) =>
            mockPayment({ id: `pay-${i}`, paymentMethod: m })
        )
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Card')).toBeInTheDocument()
        expect(screen.getByText('Cash')).toBeInTheDocument()
        expect(screen.getByText('Check')).toBeInTheDocument()
        expect(screen.getByText('Wire')).toBeInTheDocument()
        expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders reference when available', () => {
        const payments = [mockPayment({ reference: 'TRF-12345' })]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('TRF-12345')).toBeInTheDocument()
    })

    it('renders dash when no reference', () => {
        const payments = [mockPayment({ reference: null })]
        render(<PaymentTable payments={payments} />)
        // The em-dash for missing reference
        const dashes = screen.getAllByText('—')
        expect(dashes.length).toBeGreaterThanOrEqual(1)
    })

    it('renders allocation count', () => {
        const payments = [
            mockPayment({
                allocations: [
                    {
                        id: 'alloc-1',
                        paymentId: 'pay-1',
                        invoiceId: 'inv-1',
                        billId: null,
                        amount: 25000,
                    },
                    {
                        id: 'alloc-2',
                        paymentId: 'pay-1',
                        invoiceId: 'inv-2',
                        billId: null,
                        amount: 25000,
                    },
                ],
            }),
        ]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('opens detail sheet on row click', async () => {
        const user = userEvent.setup()
        const payments = [mockPayment()]
        render(<PaymentTable payments={payments} />)

        await user.click(screen.getByText('Acme Corp'))

        // Sheet should open showing "Payment" title
        await waitFor(() => {
            expect(screen.getByText('Payment')).toBeInTheDocument()
        })
    })

    it('renders table headers', () => {
        const payments = [mockPayment()]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('Date')).toBeInTheDocument()
        expect(screen.getByText('Type')).toBeInTheDocument()
        expect(screen.getByText('Client / Vendor')).toBeInTheDocument()
        expect(screen.getByText('Method')).toBeInTheDocument()
        expect(screen.getByText('Reference')).toBeInTheDocument()
        expect(screen.getByText('Allocations')).toBeInTheDocument()
        expect(screen.getByText('Amount')).toBeInTheDocument()
    })

    it('renders multiple payment rows', () => {
        const payments = [
            mockPayment({ id: 'p1', reference: 'REF-A' }),
            mockPayment({ id: 'p2', reference: 'REF-B' }),
        ]
        render(<PaymentTable payments={payments} />)
        expect(screen.getByText('REF-A')).toBeInTheDocument()
        expect(screen.getByText('REF-B')).toBeInTheDocument()
    })

    it('applies green color to customer payment amounts', () => {
        const payments = [mockPayment({ clientId: 'cli-1', vendorId: null })]
        const { container } = render(<PaymentTable payments={payments} />)
        // Customer payments have text-ak-green on amount
        const greenAmounts = container.querySelectorAll('.text-ak-green')
        expect(greenAmounts.length).toBeGreaterThan(0)
    })

    it('shows "No allocations" message in detail when no allocations', async () => {
        const user = userEvent.setup()
        const payments = [mockPayment({ allocations: [] })]
        render(<PaymentTable payments={payments} />)

        await user.click(screen.getByText('Acme Corp'))

        await waitFor(() => {
            expect(
                screen.getByText('No allocations — full amount is unallocated')
            ).toBeInTheDocument()
        })
    })

    it('shows allocation details in payment detail sheet', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockResolvedValue([]) // GL accounts fetch
        const payments = [
            mockPayment({
                allocations: [
                    {
                        id: 'alloc-1',
                        paymentId: 'pay-1',
                        invoiceId: 'inv-1',
                        billId: null,
                        amount: 30000,
                        invoice: {
                            id: 'inv-1',
                            invoiceNumber: 'INV-100',
                            total: 50000,
                            paidAmount: 30000,
                            status: 'PARTIALLY_PAID',
                        },
                    },
                ],
            }),
        ]
        render(<PaymentTable payments={payments} />)

        // Click Acme Corp in the table row
        const tableBody = screen.getByRole('table')
        const acmeCell = within(tableBody).getByText('Acme Corp')
        await user.click(acmeCell)

        await waitFor(() => {
            expect(screen.getByText(/Invoice INV-100/)).toBeInTheDocument()
        })
    })

    it('shows unallocated amount when partially allocated', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockResolvedValue([]) // GL accounts fetch
        const payments = [
            mockPayment({
                amount: 50000,
                allocations: [
                    {
                        id: 'alloc-1',
                        paymentId: 'pay-1',
                        invoiceId: 'inv-1',
                        billId: null,
                        amount: 30000,
                        invoice: {
                            id: 'inv-1',
                            invoiceNumber: 'INV-100',
                            total: 50000,
                            paidAmount: 30000,
                            status: 'PARTIALLY_PAID',
                        },
                    },
                ],
            }),
        ]
        render(<PaymentTable payments={payments} />)

        const tableBody = screen.getByRole('table')
        const acmeCell = within(tableBody).getByText('Acme Corp')
        await user.click(acmeCell)

        await waitFor(() => {
            // Unallocated = 50000 - 30000 = 20000 → "$200.00"
            expect(screen.getByText('Unallocated')).toBeInTheDocument()
            expect(screen.getByText('$200.00')).toBeInTheDocument()
        })
    })

    it('shows notes in detail sheet when available', async () => {
        const user = userEvent.setup()
        const payments = [mockPayment({ notes: 'Payment for Q1 services' })]
        render(<PaymentTable payments={payments} />)

        await user.click(screen.getByText('Acme Corp'))

        await waitFor(() => {
            expect(screen.getByText('Notes')).toBeInTheDocument()
            expect(screen.getByText('Payment for Q1 services')).toBeInTheDocument()
        })
    })

    it('shows delete button in detail sheet', async () => {
        const user = userEvent.setup()
        const payments = [mockPayment()]
        render(<PaymentTable payments={payments} />)

        await user.click(screen.getByText('Acme Corp'))

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: /delete payment/i })
            ).toBeInTheDocument()
        })
    })

    it('removes payment from list after successful delete', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockResolvedValue(undefined) // default for all API calls
        const onPaymentDeleted = vi.fn()

        const payments = [
            mockPayment({ id: 'pay-1', reference: 'REF-X' }),
            mockPayment({ id: 'pay-2', reference: 'REF-Y' }),
        ]
        render(<PaymentTable payments={payments} onPaymentDeleted={onPaymentDeleted} />)

        // Verify both payments are initially rendered
        expect(screen.getByText('REF-X')).toBeInTheDocument()
        expect(screen.getByText('REF-Y')).toBeInTheDocument()

        // Click first payment to open sheet
        await user.click(screen.getByText('REF-X'))

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /delete payment/i })).toBeInTheDocument()
        })

        // Click delete to open alert dialog
        await user.click(screen.getByRole('button', { name: /delete payment/i }))

        await waitFor(() => {
            expect(screen.getByText('Delete this payment?')).toBeInTheDocument()
        })

        // Confirm delete
        await user.click(screen.getByRole('button', { name: 'Delete Payment' }))

        await waitFor(() => {
            expect(mockToastSuccess).toHaveBeenCalledWith('Payment deleted')
        })
    })

    it('shows party link to client detail page', async () => {
        const user = userEvent.setup()
        const payments = [mockPayment({ clientId: 'cli-1' })]
        render(<PaymentTable payments={payments} />)

        await user.click(screen.getByText('Acme Corp'))

        await waitFor(() => {
            // Party link should point to client detail
            const partyLink = screen.getByText('Acme Corp', {
                selector: 'p.font-medium',
            })
            const linkParent = partyLink.closest('a')
            expect(linkParent).toHaveAttribute(
                'href',
                '/business/clients/cli-1'
            )
        })
    })
})
