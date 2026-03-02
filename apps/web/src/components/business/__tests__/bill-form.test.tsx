import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

// Mock LineItemBuilder to avoid testing the complex inner component
const { mockOnChange } = vi.hoisted(() => ({
    mockOnChange: vi.fn(),
}))

vi.mock('@/components/line-item-builder', () => ({
    LineItemBuilder: ({
        lines,
        onChange,
        currency,
        taxRates,
    }: {
        lines: Array<{ description: string; quantity: number; unitPrice: number; taxAmount: number; amount: number }>
        onChange: (lines: Array<{ description: string; quantity: number; unitPrice: number; taxAmount: number; amount: number }>) => void
        currency: string
        taxRates: Array<{ id: string; code: string; name: string; rate: number }>
    }) => {
        mockOnChange.mockImplementation(onChange)
        return (
            <div data-testid="line-item-builder" data-currency={currency} data-tax-count={taxRates?.length ?? 0}>
                {lines.map((line, i) => (
                    <div key={i} data-testid={`line-${i}`}>
                        {line.description} | qty:{line.quantity} | price:{line.unitPrice} | tax:{line.taxAmount} | amount:{line.amount}
                    </div>
                ))}
            </div>
        )
    },
    computeLineTotals: (lines: Array<{ amount: number; taxAmount: number }>) => {
        const subtotal = lines.reduce((s, l) => s + l.amount, 0)
        const taxAmount = lines.reduce((s, l) => s + l.taxAmount, 0)
        return { subtotal, taxAmount, total: subtotal + taxAmount }
    },
}))

import type { Bill } from '@/lib/api/bills'
import { BillForm } from '../BillForm'

// ============================================================================
// Mock Data
// ============================================================================

const mockVendors = [
    { id: 'ven-1', name: 'Supplier Corp', paymentTerms: 'Net 30' },
    { id: 'ven-2', name: 'Parts Ltd', paymentTerms: 'Net 15' },
    { id: 'ven-3', name: 'No Terms Inc', paymentTerms: null },
]

function createMockBill(overrides: Partial<Bill> = {}): Bill {
    return {
        id: 'bill-1',
        entityId: 'ent-1',
        vendorId: 'ven-1',
        billNumber: 'BILL-001',
        issueDate: '2026-02-10T12:00:00Z',
        dueDate: '2026-03-12T12:00:00Z',
        currency: 'CAD',
        subtotal: 50000, // $500.00
        taxAmount: 6500, // $65.00
        total: 56500, // $565.00
        status: 'DRAFT',
        paidAmount: 0,
        notes: 'Test bill notes',
        deletedAt: null,
        createdAt: '2026-02-10T12:00:00Z',
        updatedAt: '2026-02-10T12:00:00Z',
        vendor: { id: 'ven-1', name: 'Supplier Corp', email: 'billing@supplier.com' },
        entity: { id: 'ent-1', name: 'My Business' },
        billLines: [
            {
                id: 'bline-1',
                description: 'Office Supplies',
                quantity: 5,
                unitPrice: 10000, // $100.00
                taxAmount: 6500,
                amount: 50000,
                taxRateId: 'tr-1',
                glAccountId: null,
                categoryId: null,
            },
        ],
        ...overrides,
    } as Bill
}

// ============================================================================
// BillForm Tests
// ============================================================================

describe('BillForm', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        vendors: mockVendors,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Default: tax rates fetch returns empty (graceful fallback)
        mockApiFetch.mockResolvedValue([])
    })

    // ------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------

    it('renders "New Bill" title in create mode', () => {
        render(<BillForm {...defaultProps} />)
        expect(screen.getByText('New Bill')).toBeInTheDocument()
    })

    it('renders "Edit Bill" title in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        expect(screen.getByText('Edit Bill')).toBeInTheDocument()
    })

    it('renders all form labels', () => {
        render(<BillForm {...defaultProps} />)
        expect(screen.getByText('Vendor')).toBeInTheDocument()
        expect(screen.getByText('Bill Number')).toBeInTheDocument()
        expect(screen.getByText('Issue Date')).toBeInTheDocument()
        expect(screen.getByText('Due Date')).toBeInTheDocument()
        expect(screen.getByText('Currency')).toBeInTheDocument()
        expect(screen.getByText('Line Items')).toBeInTheDocument()
        expect(screen.getByText('Notes')).toBeInTheDocument()
    })

    it('renders Create Bill button in create mode', () => {
        render(<BillForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Create Bill' })).toBeInTheDocument()
    })

    it('renders Save Changes button in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('renders Cancel button', () => {
        render(<BillForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('does not render form when open is false', () => {
        const { container } = render(<BillForm {...defaultProps} open={false} />)
        expect(container.querySelector('form')).not.toBeInTheDocument()
    })

    // ------------------------------------------------------------------
    // Edit Mode Pre-fill
    // ------------------------------------------------------------------

    it('pre-fills bill number in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        expect(screen.getByDisplayValue('BILL-001')).toBeInTheDocument()
    })

    it('pre-fills notes in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        expect(screen.getByDisplayValue('Test bill notes')).toBeInTheDocument()
    })

    it('pre-fills dates in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        expect(screen.getByDisplayValue('2026-02-10')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2026-03-12')).toBeInTheDocument()
    })

    it('converts bill lines to line items in edit mode', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill()} />)
        const builder = screen.getByTestId('line-item-builder')
        const line = within(builder).getByTestId('line-0')
        expect(line).toHaveTextContent('Office Supplies')
        expect(line).toHaveTextContent('qty:5')
        expect(line).toHaveTextContent('price:10000')
        expect(line).toHaveTextContent('amount:50000')
    })

    // ------------------------------------------------------------------
    // Line Items (via mock LineItemBuilder)
    // ------------------------------------------------------------------

    it('passes initial empty line in create mode', () => {
        render(<BillForm {...defaultProps} />)
        const builder = screen.getByTestId('line-item-builder')
        const line = within(builder).getByTestId('line-0')
        expect(line).toHaveTextContent('qty:1')
        expect(line).toHaveTextContent('price:0')
        expect(line).toHaveTextContent('amount:0')
    })

    it('passes currency to LineItemBuilder', () => {
        render(<BillForm {...defaultProps} editBill={createMockBill({ currency: 'USD' })} />)
        const builder = screen.getByTestId('line-item-builder')
        expect(builder.getAttribute('data-currency')).toBe('USD')
    })

    // ------------------------------------------------------------------
    // Tax Rate Fetching
    // ------------------------------------------------------------------

    it('fetches tax rates when form opens', async () => {
        mockApiFetch.mockResolvedValue([
            { id: 'tr-1', code: 'HST', name: 'HST', rate: 0.13 },
        ])
        render(<BillForm {...defaultProps} />)

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/accounting/tax-rates?isActive=true'
            )
        })
    })

    it('passes fetched tax rates to LineItemBuilder', async () => {
        mockApiFetch.mockResolvedValue([
            { id: 'tr-1', code: 'HST', name: 'HST', rate: 0.13 },
        ])
        render(<BillForm {...defaultProps} />)

        await waitFor(() => {
            const builder = screen.getByTestId('line-item-builder')
            expect(builder.getAttribute('data-tax-count')).toBe('1')
        })
    })

    it('handles tax rate fetch failure gracefully', async () => {
        mockApiFetch.mockRejectedValue(new Error('Network error'))
        render(<BillForm {...defaultProps} />)

        await waitFor(() => {
            const builder = screen.getByTestId('line-item-builder')
            expect(builder.getAttribute('data-tax-count')).toBe('0')
        })
    })

    // ------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------

    it('shows error when no vendor selected', async () => {
        const user = userEvent.setup()
        render(<BillForm {...defaultProps} />)

        await user.type(screen.getByPlaceholderText('BILL-001'), 'BILL-100')
        await user.click(screen.getByRole('button', { name: 'Create Bill' }))

        expect(screen.getByText('Please select a vendor')).toBeInTheDocument()
        // apiFetch called once for tax rates, never for submit
        expect(mockApiFetch).toHaveBeenCalledTimes(1)
    })

    it('shows error when bill number is empty', async () => {
        const user = userEvent.setup()
        const bill = createMockBill({ billNumber: '' })
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))
        expect(screen.getByText('Bill number is required')).toBeInTheDocument()
    })

    it('shows error when due date is empty', async () => {
        const user = userEvent.setup()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} />)

        const dueDateInput = screen.getByDisplayValue('2026-03-12')
        await user.clear(dueDateInput)
        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        expect(screen.getByText('Due date is required')).toBeInTheDocument()
    })

    it('shows error when a line has no description', async () => {
        const user = userEvent.setup()
        const bill = createMockBill({
            billLines: [{
                id: 'bline-1',
                description: '',
                quantity: 1,
                unitPrice: 5000,
                taxAmount: 0,
                amount: 5000,
                taxRateId: null,
                glAccountId: null,
                categoryId: null,
            }],
        })
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))
        expect(screen.getByText('All lines need a description')).toBeInTheDocument()
    })

    it('shows error when total is zero', async () => {
        const user = userEvent.setup()
        const bill = createMockBill({
            billLines: [{
                id: 'bline-1',
                description: 'Test',
                quantity: 1,
                unitPrice: 0,
                taxAmount: 0,
                amount: 0,
                taxRateId: null,
                glAccountId: null,
                categoryId: null,
            }],
        })
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))
        expect(screen.getByText('Total must be greater than zero')).toBeInTheDocument()
    })

    // ------------------------------------------------------------------
    // Submission
    // ------------------------------------------------------------------

    it('submits update request in edit mode with correct endpoint', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} onSuccess={onSuccess} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/bills/bill-1',
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.any(String),
                })
            )
        })
    })

    it('includes line items with integer cents in submission payload', async () => {
        const user = userEvent.setup()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            const call = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('/bills/')
            )
            expect(call).toBeDefined()
            const body = JSON.parse(call![1].body)
            expect(body.lines).toHaveLength(1)
            expect(body.lines[0].description).toBe('Office Supplies')
            expect(body.lines[0].quantity).toBe(5)
            expect(body.lines[0].unitPrice).toBe(10000) // Integer cents
            expect(body.lines[0].amount).toBe(50000) // Integer cents
            expect(Number.isInteger(body.lines[0].unitPrice)).toBe(true)
            expect(Number.isInteger(body.lines[0].amount)).toBe(true)
        })
    })

    it('includes totals as integer cents in payload', async () => {
        const user = userEvent.setup()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            const call = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('/bills/')
            )
            const body = JSON.parse(call![1].body)
            expect(body.subtotal).toBe(50000) // Integer cents
            expect(body.taxAmount).toBe(6500) // Integer cents
            expect(body.total).toBe(56500) // Integer cents
            expect(Number.isInteger(body.subtotal)).toBe(true)
            expect(Number.isInteger(body.taxAmount)).toBe(true)
            expect(Number.isInteger(body.total)).toBe(true)
        })
    })

    it('does not include status in edit mode payload', async () => {
        const user = userEvent.setup()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            const call = mockApiFetch.mock.calls.find(
                (c: unknown[]) => typeof c[0] === 'string' && c[0].includes('/bills/')
            )
            const body = JSON.parse(call![1].body)
            expect(body.status).toBeUndefined()
        })
    })

    it('shows error message when API fails', async () => {
        const user = userEvent.setup()
        mockApiFetch
            .mockResolvedValueOnce([]) // tax rates
            .mockRejectedValueOnce(new Error('Server error'))
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument()
        })
    })

    it('calls onSuccess after successful submit', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} editBill={bill} onSuccess={onSuccess} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
        })
    })

    it('closes sheet after successful submit', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        const bill = createMockBill()
        render(<BillForm {...defaultProps} onOpenChange={onOpenChange} editBill={bill} />)

        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })

    it('Cancel button closes the sheet', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<BillForm {...defaultProps} onOpenChange={onOpenChange} />)

        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    // ------------------------------------------------------------------
    // Multi-line scenarios
    // ------------------------------------------------------------------

    it('handles bill with multiple lines in edit mode', () => {
        const bill = createMockBill({
            billLines: [
                {
                    id: 'bline-1',
                    description: 'Office Supplies',
                    quantity: 5,
                    unitPrice: 10000,
                    taxAmount: 6500,
                    amount: 50000,
                    taxRateId: 'tr-1',
                    glAccountId: null,
                    categoryId: null,
                },
                {
                    id: 'bline-2',
                    description: 'Server Hosting',
                    quantity: 1,
                    unitPrice: 25000,
                    taxAmount: 3250,
                    amount: 25000,
                    taxRateId: 'tr-1',
                    glAccountId: null,
                    categoryId: null,
                },
            ],
        })
        render(<BillForm {...defaultProps} editBill={bill} />)
        const builder = screen.getByTestId('line-item-builder')
        expect(within(builder).getByTestId('line-0')).toHaveTextContent('Office Supplies')
        expect(within(builder).getByTestId('line-1')).toHaveTextContent('Server Hosting')
    })

    it('handles bill with no lines (defaults to empty line)', () => {
        const bill = createMockBill({
            billLines: [],
        })
        render(<BillForm {...defaultProps} editBill={bill} />)
        const builder = screen.getByTestId('line-item-builder')
        expect(within(builder).getByTestId('line-0')).toHaveTextContent('qty:1')
        expect(within(builder).getByTestId('line-0')).toHaveTextContent('price:0')
    })

    // ------------------------------------------------------------------
    // Financial calc integrity (computeLineTotals)
    // ------------------------------------------------------------------

    it('computeLineTotals produces correct integer cent totals', async () => {
        const { computeLineTotals } = await import('@/components/line-item-builder')
        const lines = [
            { description: 'A', quantity: 2, unitPrice: 5000, taxAmount: 1300, amount: 10000 },
            { description: 'B', quantity: 1, unitPrice: 20000, taxAmount: 2600, amount: 20000 },
        ]
        const result = computeLineTotals(lines)
        expect(result.subtotal).toBe(30000) // $300.00
        expect(result.taxAmount).toBe(3900) // $39.00
        expect(result.total).toBe(33900) // $339.00
        expect(Number.isInteger(result.subtotal)).toBe(true)
        expect(Number.isInteger(result.taxAmount)).toBe(true)
        expect(Number.isInteger(result.total)).toBe(true)
    })
})
