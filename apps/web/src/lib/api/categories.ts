import { apiClient } from './client';

/**
 * Category from API
 */
export interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    parentCategoryId: string | null;
    color: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    childCategories?: Category[];
    _count?: {
        transactions: number;
    };
}

export interface ListCategoriesParams {
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    isActive?: boolean;
    includeChildren?: boolean;
}

export interface CreateCategoryInput {
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    parentCategoryId?: string;
    color?: string;
}

export interface UpdateCategoryInput {
    name?: string;
    type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    parentCategoryId?: string | null;
    color?: string | null;
    isActive?: boolean;
}

/**
 * SERVER-ONLY API Functions
 */

/**
 * List categories for the tenant
 */
export async function listCategories(
    params?: ListCategoriesParams
): Promise<{ categories: Category[] }> {
    const searchParams = new URLSearchParams();

    if (params?.type) {
        searchParams.append('type', params.type);
    }
    if (params?.isActive !== undefined) {
        searchParams.append('isActive', String(params.isActive));
    }
    if (params?.includeChildren !== undefined) {
        searchParams.append('includeChildren', String(params.includeChildren));
    }

    const query = searchParams.toString();
    return apiClient<{ categories: Category[] }>(
        `/api/banking/categories${query ? `?${query}` : ''}`
    );
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<Category> {
    return apiClient<Category>(`/api/banking/categories/${id}`);
}

/**
 * Create a new category
 */
export async function createCategory(input: CreateCategoryInput): Promise<Category> {
    return apiClient<Category>('/api/banking/categories', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    return apiClient<Category>(`/api/banking/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });
}

/**
 * Soft-delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
    return apiClient<void>(`/api/banking/categories/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Seed default categories (idempotent)
 */
export async function seedCategories(): Promise<{ created: number; existing: number }> {
    return apiClient<{ created: number; existing: number }>('/api/banking/categories/seed', {
        method: 'POST',
    });
}

/**
 * Deduplicate categories (merge duplicates, reassign transactions)
 */
export async function deduplicateCategories(): Promise<{ removed: number; reassigned: number }> {
    return apiClient<{ removed: number; reassigned: number }>('/api/banking/categories/dedup', {
        method: 'POST',
    });
}
