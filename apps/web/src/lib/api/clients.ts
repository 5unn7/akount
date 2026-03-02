import { apiClient } from './client';

/**
 * Client API Client (SERVER-ONLY)
 *
 * Type-safe client functions for the Client API.
 * Must only be called from Server Components, Server Actions, or Route Handlers.
 */

// ============================================================================
// Types
// ============================================================================

export interface Client {
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
  };
  // Aggregated stats (only when fetching single client)
  openInvoices?: number;
  balanceDue?: number; // Integer cents
}

export interface ListClientsParams {
  entityId?: string;
  status?: 'active' | 'inactive';
  search?: string; // Searches name or email
  cursor?: string;
  limit?: number;
}

export interface ListClientsResponse {
  clients: Client[];
  nextCursor: string | null;
}

export interface CreateClientInput {
  entityId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateClientInput {
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
 * List clients with optional filters
 */
export async function listClients(
  params?: ListClientsParams
): Promise<ListClientsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.entityId) searchParams.append('entityId', params.entityId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.cursor) searchParams.append('cursor', params.cursor);
  if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));

  const endpoint = `/api/business/clients${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  return apiClient<ListClientsResponse>(endpoint);
}

/**
 * Get a single client by ID (includes aggregated stats)
 */
export async function getClient(id: string): Promise<Client> {
  return apiClient<Client>(`/api/business/clients/${id}`);
}

/**
 * Create a new client
 */
export async function createClient(data: CreateClientInput): Promise<Client> {
  return apiClient<Client>('/api/business/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing client
 */
export async function updateClient(
  id: string,
  data: UpdateClientInput
): Promise<Client> {
  return apiClient<Client>(`/api/business/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Soft delete a client
 */
export async function deleteClient(id: string): Promise<void> {
  return apiClient<void>(`/api/business/clients/${id}`, {
    method: 'DELETE',
  });
}
