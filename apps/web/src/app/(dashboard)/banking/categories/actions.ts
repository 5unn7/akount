'use server';

import {
    createCategory,
    updateCategory,
    deleteCategory,
    type CreateCategoryInput,
    type UpdateCategoryInput,
} from '@/lib/api/categories';

export async function createCategoryAction(input: CreateCategoryInput) {
    return createCategory(input);
}

export async function updateCategoryAction(id: string, input: UpdateCategoryInput) {
    return updateCategory(id, input);
}

export async function deleteCategoryAction(id: string) {
    return deleteCategory(id);
}
