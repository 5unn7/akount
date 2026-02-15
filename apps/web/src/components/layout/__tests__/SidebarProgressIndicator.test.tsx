import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SidebarProgressIndicator } from '../SidebarProgressIndicator'
import { apiFetch } from '@/lib/api/client-browser'

const mockApiFetch = vi.mocked(apiFetch)

describe('SidebarProgressIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders progress bar and percentage', async () => {
    mockApiFetch.mockResolvedValue({ completionPercentage: 60 })

    render(<SidebarProgressIndicator />)
    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument()
    })
  })

  it('renders nothing when progress is 100%', async () => {
    mockApiFetch.mockResolvedValue({ completionPercentage: 100 })

    const { container } = render(<SidebarProgressIndicator />)
    await waitFor(() => {
      // Give it time to load and decide
      expect(container.childElementCount).toBe(0)
    })
  })

  it('renders nothing when apiFetch fails', async () => {
    mockApiFetch.mockRejectedValue(new Error('fail'))

    const { container } = render(<SidebarProgressIndicator />)
    // Wait for the error to propagate
    await new Promise(r => setTimeout(r, 50))
    expect(container.childElementCount).toBe(0)
  })

  it('shows tooltip with percentage', async () => {
    mockApiFetch.mockResolvedValue({ completionPercentage: 75 })

    const { container } = render(<SidebarProgressIndicator />)
    await waitFor(() => {
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.getAttribute('title')).toBe('75% complete - Click to continue setup')
    })
  })
})
