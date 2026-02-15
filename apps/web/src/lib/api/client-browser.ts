/**
 * Browser-side API client for client components
 *
 * Unlike `client.ts` (server-side only, uses auth() from @clerk/nextjs/server),
 * this uses window.Clerk to get tokens and is safe for 'use client' components.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Get and validate the API URL
 * Throws clear error if URL is not configured
 */
function getAPIUrl(): string {
  if (!API_URL) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured. Please set it in your .env.local file.'
    )
  }
  return API_URL
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const clerk = (window as any).Clerk
  const token = await clerk?.session?.getToken()

  if (!token) {
    throw new Error('Not authenticated — please sign in')
  }

  try {
    const apiUrl = getAPIUrl()
    const response = await fetch(`${apiUrl}${endpoint}`, {
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
  } catch (error) {
    // Network errors (ECONNREFUSED, DNS failures, etc)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Cannot connect to API server at ${API_URL}. ` +
        `Please ensure the API server is running (npm run dev at root).`
      )
    }
    // Re-throw other errors (auth, validation, etc)
    throw error
  }
}
