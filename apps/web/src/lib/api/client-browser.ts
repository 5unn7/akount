/**
 * Browser-side API client for client components
 *
 * Unlike `client.ts` (server-side only, uses auth() from @clerk/nextjs/server),
 * this uses window.Clerk to get tokens and is safe for 'use client' components.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const clerk = (window as any).Clerk
  const token = await clerk?.session?.getToken()

  if (!token) {
    throw new Error('Not authenticated — please sign in')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new Error(error.message || error.error || `API error: ${response.status}`)
  }

  if (response.status === 204) return undefined as never
  return response.json()
}
