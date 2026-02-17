/**
 * Client-only report functions.
 * Use in client components only.
 * DO NOT import in Server Components.
 */

'use client';

// Re-export types for convenience
export * from './reports-types';

/**
 * Download a report as PDF or CSV from a client component.
 * Uses Clerk session token for authenticated blob downloads.
 */
export async function downloadReport(
    reportPath: string,
    params: Record<string, string | undefined>,
    format: 'pdf' | 'csv'
): Promise<void> {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
    const token = await clerk?.session?.getToken();

    if (!token) {
        throw new Error('Not authenticated — please sign in');
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.append(key, value);
    }
    searchParams.append('format', format);

    const response = await fetch(
        `${apiUrl}/api/accounting/reports/${reportPath}?${searchParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || err.message || 'Export failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Extract filename from Content-Disposition or use default
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    a.download = filenameMatch?.[1] || `report.${format}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
