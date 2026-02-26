import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to UN-mock client-browser for this file since setup.ts globally mocks it.
// We want to test the real implementation here.
vi.unmock('@/lib/api/client-browser')

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import the real apiFetch after unmocking
const { apiFetch } = await import('../client-browser')

// ============================================================================
// Helpers
// ============================================================================

function mockClerkSession(token: string | null) {
    ;(window as Record<string, unknown>).Clerk = {
        session: {
            getToken: vi.fn().mockResolvedValue(token),
        },
    }
}

function clearClerk() {
    delete (window as Record<string, unknown>).Clerk
}

function createMockResponse(
    body: unknown,
    status = 200,
    statusText = 'OK'
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
        json: vi.fn().mockResolvedValue(body),
        text: vi.fn().mockResolvedValue(JSON.stringify(body)),
        headers: new Headers(),
    } as unknown as Response
}

describe('client-browser apiFetch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockClerkSession('test-token-abc')
    })

    afterEach(() => {
        clearClerk()
    })

    // ── Auth Header Injection ──────────────────────────────────────────

    describe('authentication', () => {
        it('should include Authorization header with Bearer token', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({ success: true })
            )

            await apiFetch('/api/test')

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const [, options] = mockFetch.mock.calls[0]
            expect(options.headers.Authorization).toBe('Bearer test-token-abc')
        })

        it('should throw when Clerk session has no token', async () => {
            mockClerkSession(null)

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Not authenticated'
            )
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should throw when Clerk is not available on window', async () => {
            clearClerk()

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Not authenticated'
            )
            expect(mockFetch).not.toHaveBeenCalled()
        })
    })

    // ── Base URL Construction ──────────────────────────────────────────

    describe('URL construction', () => {
        it('should prepend API_URL to endpoint', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({ data: 'ok' })
            )

            await apiFetch('/api/banking/accounts')

            const [url] = mockFetch.mock.calls[0]
            // API_URL defaults to http://localhost:4000
            expect(url).toBe('http://localhost:4000/api/banking/accounts')
        })

        it('should set Content-Type to application/json by default', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({ data: 'ok' })
            )

            await apiFetch('/api/test')

            const [, options] = mockFetch.mock.calls[0]
            expect(options.headers['Content-Type']).toBe('application/json')
        })

        it('should merge custom options with defaults', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({ id: 'created' }, 201)
            )

            await apiFetch('/api/test', {
                method: 'POST',
                body: JSON.stringify({ name: 'Test' }),
            })

            const [url, options] = mockFetch.mock.calls[0]
            expect(url).toBe('http://localhost:4000/api/test')
            expect(options.method).toBe('POST')
            expect(options.body).toBe(JSON.stringify({ name: 'Test' }))
            expect(options.headers.Authorization).toBe('Bearer test-token-abc')
        })
    })

    // ── Response Parsing ───────────────────────────────────────────────

    describe('response handling', () => {
        it('should parse JSON response for 200 status', async () => {
            const responseBody = {
                accounts: [{ id: 'acc-001', currentBalance: 100000 }],
            }
            mockFetch.mockResolvedValueOnce(
                createMockResponse(responseBody)
            )

            const result = await apiFetch('/api/banking/accounts')

            expect(result).toEqual(responseBody)
        })

        it('should return undefined for 204 No Content', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse(null, 204, 'No Content')
            )

            const result = await apiFetch('/api/banking/accounts/acc-001')

            // 204 returns undefined as never
            expect(result).toBeUndefined()
        })

        it('should parse monetary values as integers (not floats)', async () => {
            const responseBody = {
                id: 'txn-001',
                amount: 50000, // $500.00 in integer cents
                currentBalance: 250000, // $2,500.00 in integer cents
            }
            mockFetch.mockResolvedValueOnce(
                createMockResponse(responseBody)
            )

            const result = await apiFetch<typeof responseBody>('/api/test')

            expect(Number.isInteger(result.amount)).toBe(true)
            expect(Number.isInteger(result.currentBalance)).toBe(true)
        })
    })

    // ── Error Handling ─────────────────────────────────────────────────

    describe('error handling', () => {
        it('should throw with error message from JSON response body', async () => {
            const errorResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({ message: 'Validation failed: name is required' }),
                headers: new Headers(),
            } as unknown as Response
            mockFetch.mockResolvedValueOnce(errorResponse)

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Validation failed: name is required'
            )
        })

        it('should throw with error field from JSON response body', async () => {
            const errorResponse = {
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: vi.fn().mockResolvedValue({ error: 'Insufficient permissions' }),
                headers: new Headers(),
            } as unknown as Response
            mockFetch.mockResolvedValueOnce(errorResponse)

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Insufficient permissions'
            )
        })

        it('should throw with status text when JSON parsing fails', async () => {
            const errorResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: vi.fn().mockRejectedValue(new Error('not json')),
                headers: new Headers(),
            } as unknown as Response
            mockFetch.mockResolvedValueOnce(errorResponse)

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Internal Server Error'
            )
        })

        it('should throw a connection error when fetch itself fails with TypeError', async () => {
            mockFetch.mockRejectedValueOnce(
                new TypeError('fetch failed')
            )

            await expect(apiFetch('/api/test')).rejects.toThrow(
                'Cannot connect to API server'
            )
        })

        it('should re-throw non-TypeError errors as-is', async () => {
            // Simulate an error thrown from the ok check path
            // by having fetch return a non-ok response with specific message
            const errorResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: vi.fn().mockResolvedValue({ message: 'Token expired' }),
                headers: new Headers(),
            } as unknown as Response
            mockFetch.mockResolvedValueOnce(errorResponse)

            await expect(apiFetch('/api/test')).rejects.toThrow('Token expired')
        })
    })

    // ── Custom Headers ─────────────────────────────────────────────────

    describe('custom headers', () => {
        it('should allow overriding headers via options', async () => {
            mockFetch.mockResolvedValueOnce(
                createMockResponse({ ok: true })
            )

            await apiFetch('/api/test', {
                headers: { 'X-Custom': 'custom-value' },
            })

            const [, options] = mockFetch.mock.calls[0]
            expect(options.headers['X-Custom']).toBe('custom-value')
            // Auth header should still be present
            expect(options.headers.Authorization).toBe('Bearer test-token-abc')
        })
    })
})
