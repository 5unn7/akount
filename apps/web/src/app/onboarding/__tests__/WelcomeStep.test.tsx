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

  it('renders both account type cards', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Just me')).toBeInTheDocument()
    expect(screen.getByText('Me + my business')).toBeInTheDocument()
  })

  it('renders descriptions for each card', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('Personal finances only')).toBeInTheDocument()
    expect(screen.getByText('Personal and business together')).toBeInTheDocument()
  })

  it('renders helper text about adding business later', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText('You can always add a business later.')).toBeInTheDocument()
  })

  it('calls onNext when "Just me" is clicked and sets personal', async () => {
    const user = userEvent.setup()
    render(<WelcomeStep onNext={mockOnNext} />)

    await user.click(screen.getByText('Just me'))
    expect(mockOnNext).toHaveBeenCalledOnce()
    expect(useOnboardingStore.getState().accountType).toBe('personal')
  })

  it('calls onNext when "Me + my business" is clicked and sets business', async () => {
    const user = userEvent.setup()
    render(<WelcomeStep onNext={mockOnNext} />)

    await user.click(screen.getByText('Me + my business'))
    expect(mockOnNext).toHaveBeenCalledOnce()
    expect(useOnboardingStore.getState().accountType).toBe('business')
  })

  it('renders subheading text', () => {
    render(<WelcomeStep onNext={mockOnNext} />)
    expect(screen.getByText(/Who are we helping today/)).toBeInTheDocument()
  })
})
