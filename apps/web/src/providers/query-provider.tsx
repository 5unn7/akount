'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

/**
 * React Query Provider
 *
 * Provides React Query context to the application.
 * Prevents duplicate fetches across components and manages server state.
 *
 * Configuration:
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - cacheTime: 10 minutes (unused data kept in cache for 10 min)
 * - refetchOnWindowFocus: false (don't auto-refetch on tab focus)
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance per render (Next.js pattern)
  // See: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't auto-refetch on tab focus
            retry: 1, // Retry failed requests once
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}