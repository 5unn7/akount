'use server';

import { apiClient } from '@/lib/api/client';
import type { GLLedgerReport, GLLedgerQuery } from '@/lib/api/reports';

/**
 * Server Action for loading more GL entries (pagination).
 * This wraps the API call to avoid importing server-only modules in client components.
 */
export async function loadMoreGLEntries(
    params: GLLedgerQuery
): Promise<GLLedgerReport> {
    const searchParams = new URLSearchParams();
    searchParams.append('entityId', params.entityId);
    searchParams.append('glAccountId', params.glAccountId);
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit !== undefined) searchParams.append('limit', String(params.limit));

    return apiClient<GLLedgerReport>(
        `/api/accounting/reports/general-ledger?${searchParams.toString()}`
    );
}
