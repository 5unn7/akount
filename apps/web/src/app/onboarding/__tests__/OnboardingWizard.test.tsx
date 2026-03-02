import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizard } from '../components/OnboardingWizard'
import { useOnboardingStore } from '@/stores/onboardingStore'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'test-user', isLoaded: true }),
}))

describe('OnboardingWizard', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  it('renders WelcomeStep as the first step', () => {
    render(<OnboardingWizard />)
    expect(screen.getByText('Welcome to Akount')).toBeInTheDocument()
  })

  it('does not show back button on first step', () => {
    render(<OnboardingWizard />)
    expect(screen.queryByText('Back')).not.toBeInTheDocument()
  })

  it('navigates to IntentStep after selecting account type', async () => {
    const user = userEvent.setup()
    render(<OnboardingWizard />)

    // Click "Just me" to select personal account type and advance
    await user.click(screen.getByText('Just me'))

    // Should now show the intent step (step 1)
    expect(screen.queryByText('Welcome to Akount')).not.toBeInTheDocument()
  })

  it('shows back button on step 1 (IntentStep)', async () => {
    // Manually set state to step 1 with account type selected
    useOnboardingStore.getState().setAccountType('personal')
    useOnboardingStore.getState().nextStep()

    render(<OnboardingWizard />)
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup()
    useOnboardingStore.getState().setAccountType('personal')
    useOnboardingStore.getState().nextStep()

    render(<OnboardingWizard />)
    await user.click(screen.getByText('Back'))

    // Should be back at step 0
    expect(useOnboardingStore.getState().currentStep).toBe(0)
  })

  it('shows 5 total steps for personal flow', () => {
    useOnboardingStore.getState().setAccountType('personal')
    expect(useOnboardingStore.getState().getTotalSteps()).toBe(5)
  })

  it('shows 6 total steps for business flow', () => {
    useOnboardingStore.getState().setAccountType('business')
    useOnboardingStore.getState().setEmploymentStatus('self-employed')
    expect(useOnboardingStore.getState().getTotalSteps()).toBe(6)
  })
})
