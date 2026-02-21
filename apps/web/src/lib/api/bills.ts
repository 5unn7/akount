import { apiClient } from './client';

/**
 * Bill API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Bill API (AP side).
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export interface BillLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // Integer cents
  taxAmount: number; // Integer cents
  amount: number; // Integer cents
  taxRateId?: string | null;
  glAccountId?: string | null;
  categoryId?: string | null;
}

export interface Bill {
  id: string;
  entityId: string;
  vendorId: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number; // Integer cents
  taxAmount: number; // Integer cents
  total: number; // Integer cents
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  paidAmount: number; // Integer cents
  notes?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
    email?: string | null;
  };
  entity: {
    id: string;
    name: string;
  };
  billLines: BillLine[];
}

export interface BillStats {
  outstandingAP: number; // Integer cents
  paidThisMonth: number; // Integer cents
  overdue: number; // Integer cents
  aging: {
    current: { amount: number; percentage: number };
    '1-30': { amount: number; percentage: number };
    '31-60': { amount: number; percentage: number };
    '60+': { amount: number; percentage: number };
  };
}

export interface ListBillsParams {
  entityId?: string;
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface ListBillsResponse {
  bills: Bill[];
  nextCursor: string | null;
}

export interface CreateBillInput {
  vendorId: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  notes?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    amount: number;
    taxRateId?: string;
    glAccountId?: string;
    categoryId?: string;
  }>;
}

export interface UpdateBillInput {
  billNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  notes?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List bills with optional filters
 */
export async function listBills(
  params?: ListBillsParams
): Promise<ListBillsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.vendorId) searchParams.append('vendorId', params.vendorId);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/bills${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListBillsResponse>(endpoint);
}

/**
 * Get a single bill by ID
 */
export async function getBill(id: string): Promise<Bill> {
  return apiClient<Bill>(`/api/business/bills/${id}`);
}

/**
 * Get bill stats (AP metrics + aging)
 */
export async function getBillStats(): Promise<BillStats> {
  return apiClient<BillStats>('/api/business/bills/stats');
}

/**
 * Create a new bill
 */
export async function createBill(data: CreateBillInput): Promise<Bill> {
  return apiClient<Bill>('/api/business/bills', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing bill
 */
export async function updateBill(id: string, data: UpdateBillInput): Promise<Bill> {
  return apiClient<Bill>(`/api/business/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Approve bill (DRAFT → PENDING)
 */
export async function approveBill(id: string): Promise<Bill> {
  return apiClient<Bill>(`/api/business/bills/${id}/approve`, {
    method: 'POST',
  });
}

/**
 * Cancel bill (DRAFT/PENDING → CANCELLED)
 */
export async function cancelBill(id: string): Promise<Bill> {
  return apiClient<Bill>(`/api/business/bills/${id}/cancel`, {
    method: 'POST',
  });
}

/**
 * Mark bill overdue (PENDING/PARTIALLY_PAID → OVERDUE)
 */
export async function markBillOverdue(id: string): Promise<Bill> {
  return apiClient<Bill>(`/api/business/bills/${id}/mark-overdue`, {
    method: 'POST',
  });
}

/**
 * Post bill to general ledger (creates journal entry)
 */
export async function postBill(id: string): Promise<{ journalEntryId: string; type: string }> {
  return apiClient<{ journalEntryId: string; type: string }>(`/api/business/bills/${id}/post`, {
    method: 'POST',
  });
}

/**
 * Soft delete a bill
 */
export async function deleteBill(id: string): Promise<void> {
  return apiClient<void>(`/api/business/bills/${id}`, {
    method: 'DELETE',
  });
}
