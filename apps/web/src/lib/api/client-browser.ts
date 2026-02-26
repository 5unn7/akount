/**
 * Browser-side API client for client components (SEC-40: CSRF-protected)
 *
 * Unlike `client.ts` (server-side only, uses auth() from @clerk/nextjs/server),
 * this uses window.Clerk to get tokens and is safe for 'use client' components.
 *
 * Includes CSRF protection for state-changing requests (POST, PUT, PATCH, DELETE).
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

/**
 * Get CSRF token from cookie or fetch from server
 * SEC-40: Required for POST/PUT/PATCH/DELETE requests
 */
async function getCsrfToken(): Promise<string | null> {
  // Try to read from cookie first (most efficient)
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find((c) => c.trim().startsWith('_csrf='))

  if (csrfCookie) {
    const token = csrfCookie.split('=')[1]
    if (token) return decodeURIComponent(token)
  }

  // Cookie not found or empty - fetch from server
  try {
    const apiUrl = getAPIUrl()
    const clerk = (window as any).Clerk
    const authToken = await clerk?.session?.getToken()

    const response = await fetch(`${apiUrl}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Important: send/receive cookies
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (!response.ok) {
      console.warn('[CSRF] Failed to fetch token from /api/csrf-token')
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.warn('[CSRF] Error fetching token:', error)
    return null
  }
}

/**
 * Check if request method requires CSRF protection
 */
function requiresCsrfToken(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
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

  const method = (options.method || 'GET').toUpperCase()

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  // SEC-40: Add CSRF token for state-changing requests
  if (requiresCsrfToken(method)) {
    const csrfToken = await getCsrfToken()
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    } else {
      console.warn('[CSRF] No CSRF token available for', method, endpoint)
    }
  }

  try {
    const apiUrl = getAPIUrl()
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      method,
      credentials: 'include', // SEC-40: Required for CSRF cookie handling
      headers,
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
