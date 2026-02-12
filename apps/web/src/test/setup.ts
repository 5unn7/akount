import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/onboarding',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    userId: 'test-user-id',
    isLoaded: true,
    isSignedIn: true,
  }),
  useUser: () => ({
    user: { id: 'test-user-id', firstName: 'Test' },
    isLoaded: true,
  }),
}))

// Mock apiFetch
vi.mock('@/lib/api/client-browser', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}))

// Mock recharts (avoids SVG rendering issues in jsdom)
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => children,
  Pie: ({ children }: { children: React.ReactNode }) => children,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
}))
