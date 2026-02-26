import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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

const { mockApiFetch } = vi.hoisted(() => ({
    mockApiFetch: vi.fn(),
}))

vi.mock('@/lib/api/client-browser', () => ({
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

import { AIActionWidget } from '../AIActionWidget'

// ============================================================================
// Test Data
// ============================================================================

const MOCK_STATS = {
    pending: 3,
    pendingByType: { JE_DRAFT: 1, CATEGORIZATION: 2 },
    approved: 5,
    rejected: 1,
    expired: 0,
}

const MOCK_STATS_ZERO = {
    pending: 0,
    pendingByType: {},
    approved: 5,
    rejected: 1,
    expired: 0,
}

const MOCK_ACTIONS = {
    actions: [
        {
            id: 'act-1',
            type: 'JE_DRAFT',
            title: 'Create journal entry for rent',
            status: 'PENDING',
            confidence: 95,
            priority: 'HIGH',
            createdAt: '2026-02-25T10:00:00Z',
        },
        {
            id: 'act-2',
            type: 'CATEGORIZATION',
            title: 'Categorize Starbucks as Food & Drink',
            status: 'PENDING',
            confidence: 88,
            priority: 'MEDIUM',
            createdAt: '2026-02-25T11:00:00Z',
        },
        {
            id: 'act-3',
            type: 'RULE_SUGGESTION',
            title: 'Create auto-categorization rule',
            status: 'PENDING',
            confidence: null,
            priority: 'LOW',
            createdAt: '2026-02-25T12:00:00Z',
        },
    ],
    total: 3,
}

// ============================================================================
// Tests
// ============================================================================

describe('AIActionWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should show loading skeletons initially', () => {
        // Never resolve the fetch to keep loading state
        mockApiFetch.mockReturnValue(new Promise(() => {}))

        render(<AIActionWidget entityId="ent-1" />)

        // Should have animated pulse elements (loading skeletons)
        const container = document.querySelector('.animate-pulse')
        expect(container).toBeTruthy()
    })

    it('should show empty state when no pending actions', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS_ZERO)
            .mockResolvedValueOnce({ actions: [], total: 0 })

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('No pending AI actions')).toBeInTheDocument()
        })
    })

    it('should show pending count badge', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('3')).toBeInTheDocument()
        })
    })

    it('should render action list with titles', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('Create journal entry for rent')).toBeInTheDocument()
            expect(screen.getByText('Categorize Starbucks as Food & Drink')).toBeInTheDocument()
            expect(screen.getByText('Create auto-categorization rule')).toBeInTheDocument()
        })
    })

    it('should show confidence percentage for actions that have one', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('95% confidence')).toBeInTheDocument()
            expect(screen.getByText('88% confidence')).toBeInTheDocument()
        })
    })

    it('should show "Approve Recommended" button for high-confidence actions', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            // Only act-1 has confidence >= 90 (threshold)
            expect(screen.getByText('Approve 1 Recommended')).toBeInTheDocument()
        })
    })

    it('should call batch approve API when approve button clicked', async () => {
        const user = userEvent.setup()

        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS) // initial stats
            .mockResolvedValueOnce(MOCK_ACTIONS) // initial actions
            .mockResolvedValueOnce({}) // batch approve response
            .mockResolvedValueOnce(MOCK_STATS_ZERO) // refresh stats
            .mockResolvedValueOnce({ actions: [], total: 0 }) // refresh actions

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('Approve 1 Recommended')).toBeInTheDocument()
        })

        await user.click(screen.getByText('Approve 1 Recommended'))

        await waitFor(() => {
            // Should call batch approve with only the high-confidence action
            expect(mockApiFetch).toHaveBeenCalledWith(
                '/api/ai/actions/batch/approve',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        entityId: 'ent-1',
                        actionIds: ['act-1'],
                    }),
                })
            )
        })
    })

    it('should show error state on API failure', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('Unable to load AI actions')).toBeInTheDocument()
            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })
    })

    it('should retry on error when Try Again clicked', async () => {
        const user = userEvent.setup()

        // First call fails
        mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })

        // Setup success for retry
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        await user.click(screen.getByText('Try Again'))

        await waitFor(() => {
            expect(screen.getByText('Create journal entry for rent')).toBeInTheDocument()
        })
    })

    it('should handle missing entityId gracefully', async () => {
        render(<AIActionWidget />)

        await waitFor(() => {
            // Should not call API without entityId
            expect(mockApiFetch).not.toHaveBeenCalled()
        })
    })

    it('should have View All link to insights/actions', async () => {
        mockApiFetch
            .mockResolvedValueOnce(MOCK_STATS)
            .mockResolvedValueOnce(MOCK_ACTIONS)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            const link = screen.getByText('View All')
            expect(link.closest('a')).toHaveAttribute('href', '/insights/actions')
        })
    })

    it('should not show approve button when no high-confidence actions', async () => {
        const lowConfidenceActions = {
            actions: [
                {
                    id: 'act-1',
                    type: 'CATEGORIZATION',
                    title: 'Low confidence suggestion',
                    status: 'PENDING',
                    confidence: 70,
                    priority: 'LOW',
                    createdAt: '2026-02-25T10:00:00Z',
                },
            ],
            total: 1,
        }

        mockApiFetch
            .mockResolvedValueOnce({ ...MOCK_STATS, pending: 1 })
            .mockResolvedValueOnce(lowConfidenceActions)

        render(<AIActionWidget entityId="ent-1" />)

        await waitFor(() => {
            expect(screen.getByText('Low confidence suggestion')).toBeInTheDocument()
        })

        expect(screen.queryByText(/Approve.*Recommended/)).not.toBeInTheDocument()
    })
})
