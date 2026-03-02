import { apiClient } from './client';

/**
 * Credit Note API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Credit Note API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export interface CreditNote {
  id: string;
  entityId: string;
  creditNoteNumber: string;
  date: string;
  currency: string;
  amount: number; // Integer cents
  appliedAmount: number; // Integer cents
  reason: string;
  notes?: string | null;
  linkedInvoiceId?: string | null;
  linkedBillId?: string | null;
  status: 'DRAFT' | 'APPROVED' | 'APPLIED' | 'VOIDED';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  entity: {
    id: string;
    name: string;
  };
  linkedInvoice?: {
    id: string;
    invoiceNumber: string;
    client: { id: string; name: string };
  } | null;
  linkedBill?: {
    id: string;
    billNumber: string;
    vendor: { id: string; name: string };
  } | null;
}

export interface ListCreditNotesParams {
  entityId?: string;
  status?: 'DRAFT' | 'APPROVED' | 'APPLIED' | 'VOIDED';
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface ListCreditNotesResponse {
  creditNotes: CreditNote[];
  nextCursor: string | null;
}

// ============================================================================
// API Functions
// ============================================================================

export async function listCreditNotes(
  params?: ListCreditNotesParams
): Promise<ListCreditNotesResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/credit-notes${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListCreditNotesResponse>(endpoint);
}

export async function getCreditNote(id: string): Promise<CreditNote> {
  return apiClient<CreditNote>(`/api/business/credit-notes/${id}`);
}
