import { vi } from 'vitest'
import { apiFetch } from '@/lib/api/client-browser'

/**
 * Mock a successful API response.
 * Uses the globally-mocked apiFetch from setup.ts.
 */
export function mockApiSuccess<T>(response: T): void {
    vi.mocked(apiFetch).mockResolvedValueOnce(response as never)
}

/**
 * Mock a sequence of successful API responses (for components that make multiple calls).
 */
export function mockApiSuccessSequence(responses: unknown[]): void {
    for (const response of responses) {
        vi.mocked(apiFetch).mockResolvedValueOnce(response as never)
    }
}

/**
 * Mock an API error response.
 */
export function mockApiError(message: string): void {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error(message))
}

/**
 * Reset the apiFetch mock to default (returns empty object).
 */
export function resetApiMock(): void {
    vi.mocked(apiFetch).mockReset()
    vi.mocked(apiFetch).mockResolvedValue({} as never)
}

/**
 * Get all calls made to apiFetch (endpoint + options).
 */
export function getApiCalls(): Array<[string, RequestInit?]> {
    return vi.mocked(apiFetch).mock.calls as Array<[string, RequestInit?]>
}
