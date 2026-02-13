import { auth } from '@clerk/nextjs/server';

/**
 * Base API client for making authenticated requests to the Akount API
 * Automatically handles authentication via Clerk JWT tokens
 *
 * NOTE: This file is SERVER-ONLY (uses @clerk/nextjs/server)
 * For client components, use @/lib/api/client-browser instead
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        throw new Error('Unauthorized: No authentication token available');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const url = `${apiUrl}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API error: ${response.status} ${response.statusText}`;

        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
            // Use default error message if JSON parsing fails
        }

        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        // Safe: only DELETE endpoints return 204, always called as apiClient<void>
        return undefined as never;
    }

    return response.json();
}
