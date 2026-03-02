import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist the mock so it's available before module imports
const { mockApiClient } = vi.hoisted(() => ({
    mockApiClient: vi.fn(),
}))

// Mock the server-only client (invoices.ts imports from './client')
vi.mock('@/lib/api/client', () => ({
    apiClient: (...args: unknown[]) => mockApiClient(...args),
}))

import {
    listInvoices,
    getInvoice,
    getInvoiceStats,
    createInvoice,
    updateInvoice,
    sendInvoice,
    cancelInvoice,
    voidInvoice,
    markInvoiceOverdue,
    postInvoice,
    deleteInvoice,
} from '../invoices'
import type {
    Invoice,
    InvoiceStats,
    ListInvoicesResponse,
    CreateInvoiceInput,
    UpdateInvoiceInput,
} from '../invoices'

// ============================================================================
// Mock Data (integer cents per invariant #2)
// ============================================================================

const MOCK_INVOICE: Invoice = {
    id: 'inv-001',
    entityId: 'ent-001',
    clientId: 'cli-001',
    invoiceNumber: 'INV-001',
    issueDate: '2024-06-01T00:00:00Z',
    dueDate: '2024-07-01T00:00:00Z',
    currency: 'CAD',
    subtotal: 100000, // $1,000.00
    taxAmount: 5000, // $50.00
    total: 105000, // $1,050.00
    status: 'DRAFT',
    paidAmount: 0,
    notes: null,
    deletedAt: null,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    client: { id: 'cli-001', name: 'Test Client', email: 'client@example.com' },
    entity: { id: 'ent-001', name: 'Acme Corp' },
    invoiceLines: [
        {
            id: 'line-001',
            description: 'Consulting',
            quantity: 10,
            unitPrice: 10000, // $100.00 per unit
            taxAmount: 5000, // $50.00
            amount: 100000, // $1,000.00 (pre-tax)
            taxRateId: null,
            glAccountId: null,
            categoryId: null,
        },
    ],
}

const MOCK_LIST_RESPONSE: ListInvoicesResponse = {
    invoices: [MOCK_INVOICE],
    nextCursor: null,
}

describe('invoices API client', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    // ── listInvoices ───────────────────────────────────────────────────

    describe('listInvoices', () => {
        it('should call /api/business/invoices with no params', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            const result = await listInvoices()

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices')
            expect(result.invoices).toHaveLength(1)
        })

        it('should append entityId query parameter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listInvoices({ entityId: 'ent-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
        })

        it('should append status filter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listInvoices({ status: 'SENT' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('status=SENT')
        })

        it('should append clientId filter', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listInvoices({ clientId: 'cli-001' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('clientId=cli-001')
        })

        it('should append date range filters', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listInvoices({ dateFrom: '2024-01-01', dateTo: '2024-12-31' })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('dateFrom=2024-01-01')
            expect(url).toContain('dateTo=2024-12-31')
        })

        it('should append cursor and limit for pagination', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_LIST_RESPONSE)

            await listInvoices({ cursor: 'cur-xyz', limit: 20 })

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('cursor=cur-xyz')
            expect(url).toContain('limit=20')
        })

        it('should propagate errors from apiClient', async () => {
            mockApiClient.mockRejectedValueOnce(new Error('Unauthorized'))

            await expect(listInvoices()).rejects.toThrow('Unauthorized')
        })
    })

    // ── getInvoice ─────────────────────────────────────────────────────

    describe('getInvoice', () => {
        it('should call /api/business/invoices/:id', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_INVOICE)

            const result = await getInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001')
            expect(result.total).toBe(105000) // integer cents
            expect(result.invoiceLines[0].unitPrice).toBe(10000) // integer cents
        })
    })

    // ── getInvoiceStats ────────────────────────────────────────────────

    describe('getInvoiceStats', () => {
        const MOCK_STATS: InvoiceStats = {
            outstandingAR: 500000, // $5,000.00
            collectedThisMonth: 200000, // $2,000.00
            overdue: 100000, // $1,000.00
            aging: {
                current: { amount: 300000, percentage: 60 },
                '1-30': { amount: 100000, percentage: 20 },
                '31-60': { amount: 50000, percentage: 10 },
                '60+': { amount: 50000, percentage: 10 },
            },
        }

        it('should call /api/business/invoices/stats without entityId', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_STATS)

            const result = await getInvoiceStats()

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/stats')
            expect(result.outstandingAR).toBe(500000) // integer cents
        })

        it('should append entityId when provided', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_STATS)

            await getInvoiceStats('ent-001')

            const url = mockApiClient.mock.calls[0][0] as string
            expect(url).toContain('entityId=ent-001')
        })
    })

    // ── createInvoice ──────────────────────────────────────────────────

    describe('createInvoice', () => {
        it('should POST to /api/business/invoices with JSON body', async () => {
            mockApiClient.mockResolvedValueOnce(MOCK_INVOICE)

            const input: CreateInvoiceInput = {
                clientId: 'cli-001',
                invoiceNumber: 'INV-001',
                issueDate: '2024-06-01',
                dueDate: '2024-07-01',
                currency: 'CAD',
                subtotal: 100000,
                taxAmount: 5000,
                total: 105000,
                status: 'DRAFT',
                lines: [
                    {
                        description: 'Consulting',
                        quantity: 10,
                        unitPrice: 10000,
                        taxAmount: 5000,
                        amount: 100000,
                    },
                ],
            }

            const result = await createInvoice(input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices', {
                method: 'POST',
                body: JSON.stringify(input),
            })
            expect(result.id).toBe('inv-001')
        })
    })

    // ── updateInvoice ──────────────────────────────────────────────────

    describe('updateInvoice', () => {
        it('should PUT to /api/business/invoices/:id with partial body', async () => {
            const updated = { ...MOCK_INVOICE, notes: 'Updated notes' }
            mockApiClient.mockResolvedValueOnce(updated)

            const input: UpdateInvoiceInput = { notes: 'Updated notes' }
            const result = await updateInvoice('inv-001', input)

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001', {
                method: 'PUT',
                body: JSON.stringify(input),
            })
            expect(result.notes).toBe('Updated notes')
        })
    })

    // ── Status Transition Actions ──────────────────────────────────────

    describe('sendInvoice', () => {
        it('should POST to /api/business/invoices/:id/send', async () => {
            const sent = { ...MOCK_INVOICE, status: 'SENT' as const }
            mockApiClient.mockResolvedValueOnce(sent)

            const result = await sendInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001/send', {
                method: 'POST',
            })
            expect(result.status).toBe('SENT')
        })
    })

    describe('cancelInvoice', () => {
        it('should POST to /api/business/invoices/:id/cancel', async () => {
            const cancelled = { ...MOCK_INVOICE, status: 'CANCELLED' as const }
            mockApiClient.mockResolvedValueOnce(cancelled)

            const result = await cancelInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001/cancel', {
                method: 'POST',
            })
            expect(result.status).toBe('CANCELLED')
        })
    })

    describe('voidInvoice', () => {
        it('should POST to /api/business/invoices/:id/void', async () => {
            const voided = { ...MOCK_INVOICE, status: 'VOIDED' as const }
            mockApiClient.mockResolvedValueOnce(voided)

            const result = await voidInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001/void', {
                method: 'POST',
            })
            expect(result.status).toBe('VOIDED')
        })
    })

    describe('markInvoiceOverdue', () => {
        it('should POST to /api/business/invoices/:id/mark-overdue', async () => {
            const overdue = { ...MOCK_INVOICE, status: 'OVERDUE' as const }
            mockApiClient.mockResolvedValueOnce(overdue)

            const result = await markInvoiceOverdue('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith(
                '/api/business/invoices/inv-001/mark-overdue',
                { method: 'POST' }
            )
            expect(result.status).toBe('OVERDUE')
        })
    })

    // ── postInvoice (GL) ───────────────────────────────────────────────

    describe('postInvoice', () => {
        it('should POST to /api/business/invoices/:id/post and return journal entry ID', async () => {
            const mockResult = { journalEntryId: 'je-001', type: 'INVOICE' }
            mockApiClient.mockResolvedValueOnce(mockResult)

            const result = await postInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001/post', {
                method: 'POST',
            })
            expect(result.journalEntryId).toBe('je-001')
            expect(result.type).toBe('INVOICE')
        })
    })

    // ── deleteInvoice ──────────────────────────────────────────────────

    describe('deleteInvoice', () => {
        it('should DELETE to /api/business/invoices/:id', async () => {
            mockApiClient.mockResolvedValueOnce(undefined)

            await deleteInvoice('inv-001')

            expect(mockApiClient).toHaveBeenCalledWith('/api/business/invoices/inv-001', {
                method: 'DELETE',
            })
        })
    })
})
