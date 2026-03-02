import { apiClient } from './client';

/**
 * Import batch from API
 */
export interface ImportBatch {
  id: string;
  entityId: string;
  accountId: string;
  sourceType: 'CSV' | 'PDF' | 'XLSX' | 'BANK_FEED' | 'API';
  sourceFileName: string;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  totalRows: number;
  processedRows: number;
  errorRows: number;
  duplicateRows: number;
  errorDetails: string | null;
  createdAt: string;
  updatedAt: string;
  account?: {
    id: string;
    name: string;
    type: string;
  };
}

/**
 * Import batch with transactions (returned by GET /imports/:id)
 */
export interface ImportBatchDetail extends ImportBatch {
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    currency: string;
    categoryId: string | null;
    sourceType: string;
    category?: { id: string; name: string } | null;
  }>;
  _count: {
    transactions: number;
  };
}

/**
 * Query parameters for listing import batches
 */
export interface ListImportsParams {
  entityId?: string;
  sourceType?: 'CSV' | 'PDF' | 'XLSX' | 'BANK_FEED' | 'API';
  status?: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  cursor?: string;
  limit?: number;
}

/**
 * Paginated response from the imports API
 */
export interface ListImportsResponse {
  batches: ImportBatch[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Fetch list of import batches
 */
export async function listImports(
  params?: ListImportsParams
): Promise<ListImportsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.sourceType) searchParams.append('sourceType', params.sourceType);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const qs = searchParams.toString();
  return apiClient<ListImportsResponse>(`/api/banking/imports${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch a single import batch with transactions
 */
export async function getImportBatch(id: string): Promise<ImportBatchDetail> {
  return apiClient<ImportBatchDetail>(`/api/banking/imports/${id}`);
}

/**
 * Format import status for display
 */
export function formatImportStatus(status: ImportBatch['status']): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  switch (status) {
    case 'PROCESSED':
      return { label: 'Complete', variant: 'default' };
    case 'PROCESSING':
      return { label: 'Processing', variant: 'secondary' };
    case 'PENDING':
      return { label: 'Pending', variant: 'outline' };
    case 'FAILED':
      return { label: 'Failed', variant: 'destructive' };
  }
}
