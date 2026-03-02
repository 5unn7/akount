import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircularProgress } from '../CircularProgress'

describe('CircularProgress', () => {
  it('renders percentage text', () => {
    render(<CircularProgress value={45} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('renders 0% for zero value', () => {
    render(<CircularProgress value={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders 100% for full value', () => {
    render(<CircularProgress value={100} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('applies custom size', () => {
    const { container } = render(<CircularProgress value={50} size={200} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.width).toBe('200px')
    expect(wrapper.style.height).toBe('200px')
  })

  it('uses default size of 120px', () => {
    const { container } = render(<CircularProgress value={50} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.width).toBe('120px')
    expect(wrapper.style.height).toBe('120px')
  })
})
