import { apiClient } from './client';

/**
 * Entity from API
 */
export interface Entity {
    id: string;
    name: string;
    type: 'BUSINESS' | 'PERSONAL';
    currency: string;
}

/**
 * Entities list response from API
 */
export interface EntitiesResponse {
    entities: Entity[];
}

/**
 * Fetch list of entities for the current user's tenant
 * Server Component compatible - uses apiClient
 */
export async function listEntities(): Promise<Entity[]> {
    const response = await apiClient<EntitiesResponse>('/api/entities');
    return response.entities;
}
