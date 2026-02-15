import { apiClient } from './client';

export type EntityType = 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC';

/**
 * Entity from API
 */
export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    currency: string;
    country?: string;
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
}

/**
 * Fetch list of entities for the current user's tenant
 * Server Component compatible - uses apiClient
 */
export async function listEntities(): Promise<Entity[]> {
    const response = await apiClient<EntitiesResponse>('/api/system/entities');
    return response.entities;
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
