import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeStep } from '../components/steps/WelcomeStep'
import { useOnboardingStore } from '@/stores/onboardingStore'

describe('WelcomeStep', () => {
  const mockOnNext = vi.fn()

  beforeEach(() => {
    mockOnNext.mockClear()
    useOnboardingStore.getState().reset()
  })

  it('renders welcome heading', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Welcome to Akount')).toBeInTheDocument()
  })

  it('renders all three account type cards', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Accountant')).toBeInTheDocument()
  })

  it('shows Recommended badge on Business card', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('shows Coming soon badge on Accountant card', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('calls onNext when Personal is clicked', async () => {
    const user = userEvent.setup()
    render(<WelcomeStep onNext={mockOnNext} />)

    await user.click(screen.getByText('Personal'))
    expect(mockOnNext).toHaveBeenCalledOnce()
    expect(useOnboardingStore.getState().accountType).toBe('personal')
  })

  it('calls onNext when Business is clicked', async () => {
    const user = userEvent.setup()
    render(<WelcomeStep onNext={mockOnNext} />)

    await user.click(screen.getByText('Business'))
    expect(mockOnNext).toHaveBeenCalledOnce()
    expect(useOnboardingStore.getState().accountType).toBe('business')
  })

  it('does not call onNext when disabled Accountant is clicked', async () => {
    const user = userEvent.setup()
    render(<WelcomeStep onNext={mockOnNext} />)

    await user.click(screen.getByText('Accountant'))
    expect(mockOnNext).not.toHaveBeenCalled()
  })

  it('renders feature lists for each card', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Track income & expenses')).toBeInTheDocument()
    expect(screen.getByText('Full bookkeeping suite')).toBeInTheDocument()
    expect(screen.getByText('Client management')).toBeInTheDocument()
  })
})
