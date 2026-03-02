import type { Metadata } from 'next';
import { CategoriesClient } from './categories-client';
import { listCategories } from '@/lib/api/categories';

export const metadata: Metadata = {
    title: 'Categories | Akount',
    description: 'Manage transaction categories for income, expenses, and transfers',
};

export default async function CategoriesPage() {
    const result = await listCategories({ includeChildren: true, isActive: true });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Categories</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Organize transactions by income, expense, and transfer categories
                    </p>
                </div>
            </div>

            <CategoriesClient initialCategories={result.categories} />
        </div>
    );
}
