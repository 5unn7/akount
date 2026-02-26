import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Mocks
// ============================================================================

const { mockToastSuccess, mockToastError, mockApiFetch } = vi.hoisted(() => ({
    mockToastSuccess: vi.fn(),
    mockToastError: vi.fn(),
    mockApiFetch: vi.fn(),
}))

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => mockToastSuccess(...args),
        error: (...args: unknown[]) => mockToastError(...args),
    },
}))

vi.mock('@/lib/api/client-browser', () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

import type { Client } from '@/lib/api/clients'
import type { Vendor } from '@/lib/api/vendors'
import { ClientForm } from '../ClientForm'
import { VendorForm } from '../VendorForm'

// ============================================================================
// Mock Data Factories
// ============================================================================

function mockClient(overrides: Partial<Client> = {}): Client {
    return {
        id: 'cli-1',
        entityId: 'ent-1',
        name: 'Acme Corp',
        email: 'billing@acme.com',
        phone: '+1 555-1234',
        address: '123 Main St, Toronto',
        paymentTerms: 'Net 30',
        status: 'active',
        deletedAt: null,
        createdAt: '2026-01-15T12:00:00Z',
        updatedAt: '2026-01-15T12:00:00Z',
        entity: { id: 'ent-1', name: 'My Business' },
        ...overrides,
    }
}

function mockVendor(overrides: Partial<Vendor> = {}): Vendor {
    return {
        id: 'ven-1',
        entityId: 'ent-1',
        name: 'Office Supply Co',
        email: 'invoices@office.com',
        phone: '+1 555-5678',
        address: '456 Oak Ave, Vancouver',
        paymentTerms: 'Net 15',
        status: 'active',
        deletedAt: null,
        createdAt: '2026-01-10T12:00:00Z',
        updatedAt: '2026-01-10T12:00:00Z',
        entity: { id: 'ent-1', name: 'My Business', functionalCurrency: 'CAD' },
        ...overrides,
    } as Vendor
}

// ============================================================================
// ClientForm
// ============================================================================

describe('ClientForm', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        entityId: 'ent-1',
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockApiFetch.mockResolvedValue({})
    })

    it('renders "New Client" title in create mode', () => {
        render(<ClientForm {...defaultProps} />)
        expect(screen.getByText('New Client')).toBeInTheDocument()
    })

    it('renders "Edit Client" title in edit mode', () => {
        render(<ClientForm {...defaultProps} editClient={mockClient()} />)
        expect(screen.getByText('Edit Client')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
        render(<ClientForm {...defaultProps} />)
        expect(screen.getByText('Client Name *')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getByText('Address')).toBeInTheDocument()
        expect(screen.getByText('Payment Terms')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders Create Client button in create mode', () => {
        render(<ClientForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Create Client' })).toBeInTheDocument()
    })

    it('renders Save Changes button in edit mode', () => {
        render(<ClientForm {...defaultProps} editClient={mockClient()} />)
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('pre-fills form fields in edit mode', () => {
        render(<ClientForm {...defaultProps} editClient={mockClient()} />)
        expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument()
        expect(screen.getByDisplayValue('billing@acme.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1 555-1234')).toBeInTheDocument()
        expect(screen.getByDisplayValue('123 Main St, Toronto')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Net 30')).toBeInTheDocument()
    })

    it('shows validation error when name is only whitespace', async () => {
        const user = userEvent.setup()
        render(<ClientForm {...defaultProps} />)

        // Type a space to bypass HTML5 required, but fail trim check
        await user.type(screen.getByPlaceholderText('Jane Smith Inc.'), ' ')
        await user.click(screen.getByRole('button', { name: 'Create Client' }))

        expect(screen.getByText('Client name is required')).toBeInTheDocument()
        expect(mockApiFetch).not.toHaveBeenCalled()
    })

    it('submits create request with form data', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        render(<ClientForm {...defaultProps} onSuccess={onSuccess} />)

        await user.type(screen.getByPlaceholderText('Jane Smith Inc.'), 'New Client LLC')
        await user.type(screen.getByPlaceholderText('client@example.com'), 'new@client.com')
        await user.click(screen.getByRole('button', { name: 'Create Client' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/clients',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('New Client LLC'),
                })
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('Client created')
    })

    it('submits update request in edit mode', async () => {
        const user = userEvent.setup()
        const client = mockClient()
        render(<ClientForm {...defaultProps} editClient={client} />)

        const nameInput = screen.getByDisplayValue('Acme Corp')
        await user.clear(nameInput)
        await user.type(nameInput, 'Acme Inc')
        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/clients/cli-1',
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('Acme Inc'),
                })
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('Client updated')
    })

    it('shows error message when API fails', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockRejectedValueOnce(new Error('Network error'))
        render(<ClientForm {...defaultProps} />)

        await user.type(screen.getByPlaceholderText('Jane Smith Inc.'), 'Test Client')
        await user.click(screen.getByRole('button', { name: 'Create Client' }))

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument()
        })
    })

    it('closes sheet after successful create', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<ClientForm {...defaultProps} onOpenChange={onOpenChange} />)

        await user.type(screen.getByPlaceholderText('Jane Smith Inc.'), 'Test')
        await user.click(screen.getByRole('button', { name: 'Create Client' }))

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })

    it('calls onSuccess callback after successful create', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        render(<ClientForm {...defaultProps} onSuccess={onSuccess} />)

        await user.type(screen.getByPlaceholderText('Jane Smith Inc.'), 'Test')
        await user.click(screen.getByRole('button', { name: 'Create Client' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
        })
    })

    it('renders Cancel button that closes sheet', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<ClientForm {...defaultProps} onOpenChange={onOpenChange} />)

        // The Cancel button is the ghost variant
        const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
        await user.click(cancelBtn)
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not render when open is false', () => {
        const { container } = render(<ClientForm {...defaultProps} open={false} />)
        expect(container.querySelector('form')).not.toBeInTheDocument()
    })
})

// ============================================================================
// VendorForm
// ============================================================================

describe('VendorForm', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        entityId: 'ent-1',
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockApiFetch.mockResolvedValue({})
    })

    it('renders "New Vendor" title in create mode', () => {
        render(<VendorForm {...defaultProps} />)
        expect(screen.getByText('New Vendor')).toBeInTheDocument()
    })

    it('renders "Edit Vendor" title in edit mode', () => {
        render(<VendorForm {...defaultProps} editVendor={mockVendor()} />)
        expect(screen.getByText('Edit Vendor')).toBeInTheDocument()
    })

    it('renders all form fields', () => {
        render(<VendorForm {...defaultProps} />)
        expect(screen.getByText('Vendor Name *')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByText('Phone')).toBeInTheDocument()
        expect(screen.getByText('Address')).toBeInTheDocument()
        expect(screen.getByText('Payment Terms')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders Create Vendor button in create mode', () => {
        render(<VendorForm {...defaultProps} />)
        expect(screen.getByRole('button', { name: 'Create Vendor' })).toBeInTheDocument()
    })

    it('renders Save Changes button in edit mode', () => {
        render(<VendorForm {...defaultProps} editVendor={mockVendor()} />)
        expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('pre-fills form fields in edit mode', () => {
        render(<VendorForm {...defaultProps} editVendor={mockVendor()} />)
        expect(screen.getByDisplayValue('Office Supply Co')).toBeInTheDocument()
        expect(screen.getByDisplayValue('invoices@office.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1 555-5678')).toBeInTheDocument()
        expect(screen.getByDisplayValue('456 Oak Ave, Vancouver')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Net 15')).toBeInTheDocument()
    })

    it('shows validation error when name is only whitespace', async () => {
        const user = userEvent.setup()
        render(<VendorForm {...defaultProps} />)

        // Type a space to bypass HTML5 required, but fail trim check
        await user.type(screen.getByPlaceholderText('Acme Corp'), ' ')
        await user.click(screen.getByRole('button', { name: 'Create Vendor' }))

        expect(screen.getByText('Vendor name is required')).toBeInTheDocument()
        expect(mockApiFetch).not.toHaveBeenCalled()
    })

    it('submits create request with form data', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        render(<VendorForm {...defaultProps} onSuccess={onSuccess} />)

        await user.type(screen.getByPlaceholderText('Acme Corp'), 'New Vendor LLC')
        await user.type(screen.getByPlaceholderText('vendor@example.com'), 'new@vendor.com')
        await user.click(screen.getByRole('button', { name: 'Create Vendor' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/vendors',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('New Vendor LLC'),
                })
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('Vendor created')
    })

    it('submits update request in edit mode', async () => {
        const user = userEvent.setup()
        const vendor = mockVendor()
        render(<VendorForm {...defaultProps} editVendor={vendor} />)

        const nameInput = screen.getByDisplayValue('Office Supply Co')
        await user.clear(nameInput)
        await user.type(nameInput, 'Office Depot')
        await user.click(screen.getByRole('button', { name: 'Save Changes' }))

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/business/vendors/ven-1',
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('Office Depot'),
                })
            )
        })
        expect(mockToastSuccess).toHaveBeenCalledWith('Vendor updated')
    })

    it('shows error message when API fails', async () => {
        const user = userEvent.setup()
        mockApiFetch.mockRejectedValueOnce(new Error('Server down'))
        render(<VendorForm {...defaultProps} />)

        await user.type(screen.getByPlaceholderText('Acme Corp'), 'Test Vendor')
        await user.click(screen.getByRole('button', { name: 'Create Vendor' }))

        await waitFor(() => {
            expect(screen.getByText('Server down')).toBeInTheDocument()
        })
    })

    it('closes sheet after successful create', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<VendorForm {...defaultProps} onOpenChange={onOpenChange} />)

        await user.type(screen.getByPlaceholderText('Acme Corp'), 'Test')
        await user.click(screen.getByRole('button', { name: 'Create Vendor' }))

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false)
        })
    })

    it('calls onSuccess callback after successful create', async () => {
        const user = userEvent.setup()
        const onSuccess = vi.fn()
        render(<VendorForm {...defaultProps} onSuccess={onSuccess} />)

        await user.type(screen.getByPlaceholderText('Acme Corp'), 'Test')
        await user.click(screen.getByRole('button', { name: 'Create Vendor' }))

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled()
        })
    })

    it('renders Cancel button that closes sheet', async () => {
        const user = userEvent.setup()
        const onOpenChange = vi.fn()
        render(<VendorForm {...defaultProps} onOpenChange={onOpenChange} />)

        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
    })
})
