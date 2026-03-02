import { apiClient } from './client';

/**
 * Payment API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Payment API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export type PaymentMethod = 'CARD' | 'TRANSFER' | 'CASH' | 'CHECK' | 'WIRE' | 'OTHER';

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string | null;
  billId: string | null;
  amount: number; // Integer cents
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number;
    paidAmount: number;
    status: string;
  } | null;
  bill?: {
    id: string;
    billNumber: string;
    total: number;
    paidAmount: number;
    status: string;
  } | null;
}

export interface Payment {
  id: string;
  entityId: string;
  date: string;
  amount: number; // Integer cents
  currency: string;
  paymentMethod: PaymentMethod;
  reference: string | null;
  clientId: string | null;
  vendorId: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  allocations: PaymentAllocation[];
}

export interface ListPaymentsParams {
  clientId?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

export interface ListPaymentsResponse {
  data: Payment[];
  nextCursor: string | null;
}

export interface CreatePaymentInput {
  date: string;
  amount: number; // Integer cents
  currency: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  clientId?: string;
  vendorId?: string;
  notes?: string;
}

export interface AllocatePaymentInput {
  invoiceId?: string;
  billId?: string;
  amount: number; // Integer cents
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List payments with optional filters
 */
export async function listPayments(
  params?: ListPaymentsParams
): Promise<ListPaymentsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.vendorId) searchParams.append('vendorId', params.vendorId);
  if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/payments${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListPaymentsResponse>(endpoint);
}

/**
 * Get a single payment by ID
 */
export async function getPayment(id: string): Promise<Payment> {
  return apiClient<Payment>(`/api/business/payments/${id}`);
}

/**
 * Record a new payment
 */
export async function recordPayment(data: CreatePaymentInput): Promise<Payment> {
  return apiClient<Payment>('/api/business/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Allocate payment to an invoice or bill
 */
export async function allocatePayment(
  paymentId: string,
  data: AllocatePaymentInput
): Promise<PaymentAllocation> {
  return apiClient<PaymentAllocation>(`/api/business/payments/${paymentId}/allocate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Remove a payment allocation
 */
export async function deallocatePayment(
  paymentId: string,
  allocationId: string
): Promise<void> {
  return apiClient<void>(`/api/business/payments/${paymentId}/allocations/${allocationId}`, {
    method: 'DELETE',
  });
}

/**
 * Post a payment allocation to the general ledger (creates journal entry)
 */
export async function postPaymentAllocation(
  paymentId: string,
  allocationId: string,
  bankGLAccountId: string
): Promise<{ journalEntryId: string; type: string }> {
  return apiClient<{ journalEntryId: string; type: string }>(
    `/api/business/payments/${paymentId}/allocations/${allocationId}/post`,
    {
      method: 'POST',
      body: JSON.stringify({ bankGLAccountId }),
    }
  );
}

/**
 * Soft delete a payment (reverses all allocations)
 */
export async function deletePayment(id: string): Promise<void> {
  return apiClient<void>(`/api/business/payments/${id}`, {
    method: 'DELETE',
  });
}
