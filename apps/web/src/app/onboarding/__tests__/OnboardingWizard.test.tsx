import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizard } from '../components/OnboardingWizard'
import { useOnboardingStore } from '@/stores/onboardingStore'

describe('OnboardingWizard', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  it('renders WelcomeStep as the first step', () => {
    render(<OnboardingWizard />)
    expect(screen.getByText('Welcome to Akount')).toBeInTheDocument()
  })

  it('does not show progress dots before account type is selected', () => {
    const { container } = render(<OnboardingWizard />)
    // Progress dots container should not be present
    const dots = container.querySelectorAll('.h-2.w-2.rounded-full')
    expect(dots.length).toBe(0)
  })

  it('does not show back button on first step', () => {
    render(<OnboardingWizard />)
    expect(screen.queryByText('Back to account type')).not.toBeInTheDocument()
  })

  it('navigates to EssentialInfoStep after selecting account type', async () => {
    const user = userEvent.setup()
    render(<OnboardingWizard />)

    // Click Personal to select account type and advance
    await user.click(screen.getByText('Personal'))

    // Should now show the essential info form (step 2)
    // The WelcomeStep heading should be gone
    expect(screen.queryByText('Welcome to Akount')).not.toBeInTheDocument()
  })

  it('shows back button on step 1 (EssentialInfo)', async () => {
    // Manually set state to step 1 with account type selected
    useOnboardingStore.getState().setAccountType('personal')

    render(<OnboardingWizard />)
    expect(screen.getByText('Back to account type')).toBeInTheDocument()
  })

  it('navigates back to WelcomeStep when back button is clicked', async () => {
    const user = userEvent.setup()
    useOnboardingStore.getState().setAccountType('personal')

    render(<OnboardingWizard />)
    await user.click(screen.getByText('Back to account type'))

    // Should be back at step 0
    expect(useOnboardingStore.getState().currentStep).toBe(0)
  })

  it('does not show welcome step on completion step', () => {
    // Set to completion step (step 2)
    useOnboardingStore.getState().setAccountType('personal')
    useOnboardingStore.getState().nextStep() // step 2

    render(<OnboardingWizard />)
    // Should not show the welcome heading anymore
    expect(screen.queryByText('Welcome to Akount')).not.toBeInTheDocument()
    // Should not show back button on completion step
    expect(screen.queryByText('Back to account type')).not.toBeInTheDocument()
  })
})
