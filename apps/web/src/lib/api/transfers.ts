import { apiClient } from './client';

/**
 * Transfer from API
 */
export interface Transfer {
  id: string;
  date: string;
  memo: string;
  sourceDocument: Record<string, unknown>;
  linkedEntryId: string | null;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  date?: string;
  memo?: string;
  exchangeRate?: number;
}

export interface ListTransfersParams {
  entityId: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}

export interface TransferResult {
  entry1Id: string;
  entry2Id: string;
  fromAccount: { id: string; name: string };
  toAccount: { id: string; name: string };
  amount: number;
  currency: string;
}

/**
 * SERVER-ONLY API Functions
 */

/**
 * Create a transfer between accounts
 */
export async function createTransfer(
  input: CreateTransferInput
): Promise<TransferResult> {
  return apiClient<TransferResult>('/api/banking/transfers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * List transfers for an entity
 */
export async function listTransfers(
  params: ListTransfersParams
): Promise<{ transfers: Transfer[]; hasMore: boolean; nextCursor?: string }> {
  const searchParams = new URLSearchParams();
  searchParams.append('entityId', params.entityId);

  if (params.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }
  if (params.limit !== undefined) {
    searchParams.append('limit', String(params.limit));
  }

  const query = searchParams.toString();
  return apiClient<{ transfers: Transfer[]; hasMore: boolean; nextCursor?: string }>(
    `/api/banking/transfers${query ? `?${query}` : ''}`
  );
}

/**
 * Get a single transfer by ID
 */
export async function getTransfer(id: string): Promise<unknown> {
  return apiClient<unknown>(`/api/banking/transfers/${id}`);
}
