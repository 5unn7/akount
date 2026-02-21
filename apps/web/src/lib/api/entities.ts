import { apiClient } from './client';

export type EntityType = 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC';
export type EntityStatus = 'ACTIVE' | 'ARCHIVED';

/**
 * Entity from API (expanded for Entity Hub)
 */
export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    status: EntityStatus;
    entitySubType: string | null;
    country: string;
    functionalCurrency: string;
    reportingCurrency: string;
    taxId: string | null;
    fiscalYearStart: number | null;
    registrationDate: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    createdAt: string;
    updatedAt: string;
    _count: {
        accounts: number;
        clients: number;
        vendors: number;
        invoices: number;
    };
}

/**
 * Entity detail (includes extended counts)
 */
export interface EntityDetail extends Entity {
    _count: {
        accounts: number;
        glAccounts: number;
        clients: number;
        vendors: number;
        invoices: number;
        bills: number;
        journalEntries: number;
        payments: number;
    };
}

/**
 * Entities list response from API
 */
export interface EntitiesResponse {
    entities: Entity[];
}

export interface CreateEntityInput {
    name: string;
    type: EntityType;
    country: string;
    currency: string;
    fiscalYearStart?: number;
    entitySubType?: string;
    taxId?: string;
}

export interface UpdateEntityInput {
    name?: string;
    fiscalYearStart?: number;
    entitySubType?: string | null;
    taxId?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    registrationDate?: string | null;
}

/**
 * Fetch list of entities for the current user's tenant
 * Server Component compatible - uses apiClient
 */
export async function listEntities(status?: EntityStatus): Promise<Entity[]> {
    const query = status ? `?status=${status}` : '';
    const response = await apiClient<EntitiesResponse>(`/api/system/entities${query}`);
    return response.entities;
}

/**
 * Get entity detail by ID
 * Server Component compatible - uses apiClient
 */
export async function getEntityDetail(id: string): Promise<EntityDetail> {
    return apiClient<EntityDetail>(`/api/system/entities/${id}`);
}

/**
 * Create a new entity for the current user's tenant
 * Server Component compatible - uses apiClient
 */
export async function createEntity(input: CreateEntityInput): Promise<Entity> {
    return apiClient<Entity>('/api/system/entities', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update an entity
 * Server Component compatible - uses apiClient
 */
export async function updateEntity(id: string, input: UpdateEntityInput): Promise<EntityDetail> {
    return apiClient<EntityDetail>(`/api/system/entities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

/**
 * Archive an entity
 * Server Component compatible - uses apiClient
 */
export async function archiveEntity(id: string): Promise<{ success: boolean; message?: string; blockers?: string[] }> {
    return apiClient(`/api/system/entities/${id}/archive`, {
        method: 'POST',
    });
}
