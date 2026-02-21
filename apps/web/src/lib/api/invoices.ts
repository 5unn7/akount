import { apiClient } from './client';

/**
 * Invoice API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Invoice API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export interface InvoiceLine {
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

export interface Invoice {
  id: string;
  entityId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number; // Integer cents
  taxAmount: number; // Integer cents
  total: number; // Integer cents
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  paidAmount: number; // Integer cents
  notes?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email?: string | null;
  };
  entity: {
    id: string;
    name: string;
  };
  invoiceLines: InvoiceLine[];
}

export interface InvoiceStats {
  outstandingAR: number; // Integer cents
  collectedThisMonth: number; // Integer cents
  overdue: number; // Integer cents
  aging: {
    current: { amount: number; percentage: number };
    '1-30': { amount: number; percentage: number };
    '31-60': { amount: number; percentage: number };
    '60+': { amount: number; percentage: number };
  };
}

export interface ListInvoicesParams {
  entityId?: string;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface ListInvoicesResponse {
  invoices: Invoice[];
  nextCursor: string | null;
}

export interface CreateInvoiceInput {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
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

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIALLY_PAID';
  notes?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List invoices with optional filters
 */
export async function listInvoices(
  params?: ListInvoicesParams
): Promise<ListInvoicesResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/invoices${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListInvoicesResponse>(endpoint);
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/api/business/invoices/${id}`);
}

/**
 * Get invoice stats (AR metrics + aging)
 */
export async function getInvoiceStats(): Promise<InvoiceStats> {
  return apiClient<InvoiceStats>('/api/business/invoices/stats');
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  return apiClient<Invoice>('/api/business/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(
  id: string,
  data: UpdateInvoiceInput
): Promise<Invoice> {
  return apiClient<Invoice>(`/api/business/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Send invoice (DRAFT → SENT)
 */
export async function sendInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/api/business/invoices/${id}/send`, {
    method: 'POST',
  });
}

/**
 * Cancel invoice (DRAFT/SENT → CANCELLED)
 */
export async function cancelInvoice(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/api/business/invoices/${id}/cancel`, {
    method: 'POST',
  });
}

/**
 * Mark invoice overdue (SENT/PARTIALLY_PAID → OVERDUE)
 */
export async function markInvoiceOverdue(id: string): Promise<Invoice> {
  return apiClient<Invoice>(`/api/business/invoices/${id}/mark-overdue`, {
    method: 'POST',
  });
}

/**
 * Post invoice to general ledger (creates journal entry)
 */
export async function postInvoice(id: string): Promise<{ journalEntryId: string; type: string }> {
  return apiClient<{ journalEntryId: string; type: string }>(`/api/business/invoices/${id}/post`, {
    method: 'POST',
  });
}

/**
 * Soft delete an invoice
 */
export async function deleteInvoice(id: string): Promise<void> {
  return apiClient<void>(`/api/business/invoices/${id}`, {
    method: 'DELETE',
  });
}
