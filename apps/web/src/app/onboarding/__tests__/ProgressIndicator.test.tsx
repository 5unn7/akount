import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressIndicator } from '../components/ProgressIndicator'

describe('ProgressIndicator', () => {
  it('renders correct step labels for 3-step (personal) flow', () => {
    render(<ProgressIndicator currentStep={0} totalSteps={3} />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('renders correct step labels for 4-step (business) flow', () => {
    render(<ProgressIndicator currentStep={0} totalSteps={4} />)
    expect(screen.getByText('Welcome')).toBeInTheDocument()
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText('Complete')).toBeInTheDocument()
  })

  it('shows step numbers for future steps', () => {
    render(<ProgressIndicator currentStep={0} totalSteps={3} />)
    // Step 1 is current, step 2 and 3 should show numbers
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows current step number', () => {
    render(<ProgressIndicator currentStep={0} totalSteps={3} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders progress bar with correct width', () => {
    const { container } = render(<ProgressIndicator currentStep={1} totalSteps={3} />)
    // Step 1 of 3 = (1+1)/3 = 66.67%
    const progressBar = container.querySelector('[style]')
    expect(progressBar).toHaveStyle({ width: '66.66666666666666%' })
  })
})
