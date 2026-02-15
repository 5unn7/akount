import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingHeroCard } from '../OnboardingHeroCard'
import { apiFetch } from '@/lib/api/client-browser'

const mockApiFetch = vi.mocked(apiFetch)

describe('OnboardingHeroCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton while fetching', () => {
    // Never resolve the promise
    mockApiFetch.mockReturnValue(new Promise(() => {}))
    const { container } = render(<OnboardingHeroCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders nothing when progress is 100%', async () => {
    mockApiFetch.mockResolvedValue({
      completionPercentage: 100,
      completedSteps: [],
      skippedSteps: [],
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: true,
      bankConnectionComplete: true,
      goalsSetupComplete: true,
    })

    const { container } = render(<OnboardingHeroCard />)
    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })
    // Should render nothing when complete
    expect(screen.queryByText('Complete Your Setup')).not.toBeInTheDocument()
  })

  it('renders checklist with incomplete steps', async () => {
    mockApiFetch.mockResolvedValue({
      completionPercentage: 40,
      completedSteps: ['basic_info', 'entity_setup'],
      skippedSteps: [],
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: false,
      bankConnectionComplete: false,
      goalsSetupComplete: false,
    })

    render(<OnboardingHeroCard />)
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // 40% appears in both CircularProgress and the text — use getAllByText
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Business details (Tax ID, Address)')).toBeInTheDocument()
    expect(screen.getByText('Connect your bank account')).toBeInTheDocument()
    expect(screen.getByText('Set goals & budget')).toBeInTheDocument()
  })

  it('shows Continue Setup button for next incomplete step', async () => {
    mockApiFetch.mockResolvedValue({
      completionPercentage: 40,
      completedSteps: ['basic_info', 'entity_setup'],
      skippedSteps: [],
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: false,
      bankConnectionComplete: false,
      goalsSetupComplete: false,
    })

    render(<OnboardingHeroCard />)
    await waitFor(() => {
      expect(screen.getByText(/Continue Setup/)).toBeInTheDocument()
    })
  })

  it('renders nothing when apiFetch fails', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))
    const { container } = render(<OnboardingHeroCard />)

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Complete Your Setup')).not.toBeInTheDocument()
  })

  it('hides checklist when collapse button is clicked', async () => {
    const user = userEvent.setup()
    mockApiFetch.mockResolvedValue({
      completionPercentage: 40,
      completedSteps: [],
      skippedSteps: [],
      basicInfoComplete: true,
      entitySetupComplete: true,
      businessDetailsComplete: false,
      bankConnectionComplete: false,
      goalsSetupComplete: false,
    })

    render(<OnboardingHeroCard />)
    await waitFor(() => {
      expect(screen.getByText('Complete Your Setup')).toBeInTheDocument()
    })

    // Click collapse button
    await user.click(screen.getByLabelText('Collapse'))
    expect(screen.queryByText('Business details (Tax ID, Address)')).not.toBeInTheDocument()
  })
})
