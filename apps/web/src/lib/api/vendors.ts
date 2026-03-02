import { apiClient } from './client';

/**
 * Vendor API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Vendor API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export interface Vendor {
  id: string;
  entityId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  status: 'active' | 'inactive';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  entity: {
    id: string;
    name: string;
    functionalCurrency: string;
  };
  // Aggregated stats (only when fetching single vendor)
  openBills?: number;
  balanceDue?: number; // Integer cents
}

export interface ListVendorsParams {
  entityId?: string;
  status?: 'active' | 'inactive';
  search?: string; // Searches name or email
  cursor?: string;
  limit?: number;
}

export interface ListVendorsResponse {
  vendors: Vendor[];
  nextCursor: string | null;
}

export interface CreateVendorInput {
  entityId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateVendorInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  status?: 'active' | 'inactive';
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List vendors with optional filters
 */
export async function listVendors(
  params?: ListVendorsParams
): Promise<ListVendorsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/vendors${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListVendorsResponse>(endpoint);
}

/**
 * Get a single vendor by ID (includes aggregated stats)
 */
export async function getVendor(id: string): Promise<Vendor> {
  return apiClient<Vendor>(`/api/business/vendors/${id}`);
}

/**
 * Create a new vendor
 */
export async function createVendor(data: CreateVendorInput): Promise<Vendor> {
  return apiClient<Vendor>('/api/business/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing vendor
 */
export async function updateVendor(
  id: string,
  data: UpdateVendorInput
): Promise<Vendor> {
  return apiClient<Vendor>(`/api/business/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Soft delete a vendor
 */
export async function deleteVendor(id: string): Promise<void> {
  return apiClient<void>(`/api/business/vendors/${id}`, {
    method: 'DELETE',
  });
}
