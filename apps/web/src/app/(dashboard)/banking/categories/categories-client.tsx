'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    TrendingUp,
    TrendingDown,
    ArrowLeftRight,
    Plus,
    Pencil,
    Trash2,
    Tag,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
} from './actions';

interface CategoriesClientProps {
    initialCategories: Category[];
}

const TYPE_CONFIG = {
    INCOME: {
        label: 'Income',
        icon: TrendingUp,
        color: 'text-ak-green',
        bgColor: 'bg-ak-green/10',
        borderColor: 'border-ak-green/20',
    },
    EXPENSE: {
        label: 'Expense',
        icon: TrendingDown,
        color: 'text-ak-red',
        bgColor: 'bg-ak-red/10',
        borderColor: 'border-ak-red/20',
    },
    TRANSFER: {
        label: 'Transfer',
        icon: ArrowLeftRight,
        color: 'text-ak-blue',
        bgColor: 'bg-ak-blue/10',
        borderColor: 'border-ak-blue/20',
    },
};

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
    const router = useRouter();
    const [categories, setCategories] = useState(initialCategories);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' as const });

    // Stats by type
    const incomeCount = categories.filter((c) => c.type === 'INCOME').length;
    const expenseCount = categories.filter((c) => c.type === 'EXPENSE').length;
    const transferCount = categories.filter((c) => c.type === 'TRANSFER').length;

    function openCreateSheet() {
        setEditingCategory(null);
        setFormData({ name: '', type: 'EXPENSE' });
        setIsEditing(true);
    }

    function openEditSheet(category: Category) {
        setEditingCategory(category);
        setFormData({ name: category.name, type: category.type });
        setIsEditing(true);
    }

    async function handleSave() {
        try {
            if (editingCategory) {
                // Update existing
                const updated = await updateCategoryAction(editingCategory.id, formData);
                setCategories((prev) =>
                    prev.map((c) => (c.id === editingCategory.id ? updated : c))
                );
                toast.success(`Category "${formData.name}" updated`);
            } else {
                // Create new
                const created = await createCategoryAction(formData);
                setCategories((prev) => [...prev, created]);
                toast.success(`Category "${formData.name}" created`);
            }
            setIsEditing(false);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save category');
        }
    }

    async function handleDelete(categoryId: string, categoryName: string) {
        try {
            await deleteCategoryAction(categoryId);
            setCategories((prev) => prev.filter((c) => c.id !== categoryId));
            toast.success(`Category "${categoryName}" deleted`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete category');
        }
    }

    // Group categories by type
    const grouped = {
        INCOME: categories.filter((c) => c.type === 'INCOME'),
        EXPENSE: categories.filter((c) => c.type === 'EXPENSE'),
        TRANSFER: categories.filter((c) => c.type === 'TRANSFER'),
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                    {/* Stats cards */}
                    {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                        const Icon = config.icon;
                        const count = type === 'INCOME' ? incomeCount : type === 'EXPENSE' ? expenseCount : transferCount;
                        return (
                            <Card key={type} className="glass">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                                                {config.label}
                                            </p>
                                            <p className="text-2xl font-mono font-bold">{count}</p>
                                        </div>
                                        <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
                                            <Icon className={cn('h-5 w-5', config.color)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                <Button onClick={openCreateSheet} className="gap-2 ml-4">
                    <Plus className="h-4 w-4" />
                    Add Category
                </Button>
            </div>

            {/* Category lists by type */}
            <div className="space-y-6">
                {Object.entries(grouped).map(([type, items]) => {
                    const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
                    const Icon = config.icon;

                    if (items.length === 0) return null;

                    return (
                        <Card key={type} className="glass">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Icon className={cn('h-4 w-4', config.color)} />
                                    {config.label} Categories
                                    <Badge variant="outline" className="ml-auto text-xs glass">
                                        {items.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {items.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-lg glass-2 border border-ak-border hover:border-ak-border-2 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={cn('p-2 rounded-lg', config.bgColor)}>
                                                <Tag className={cn('h-4 w-4', config.color)} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{category.name}</p>
                                                {category._count && category._count.transactions > 0 && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {category._count.transactions} transaction{category._count.transactions !== 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditSheet(category)}
                                                className="h-8 w-8 p-0"
                                                aria-label={`Edit category ${category.name}`}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-ak-red hover:text-ak-red hover:bg-ak-red/10"
                                                        aria-label={`Delete category ${category.name}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Category "{category.name}" will be marked as deleted.
                                                            {category._count && category._count.transactions > 0 && (
                                                                <span className="block mt-2 text-ak-red">
                                                                    Warning: {category._count.transactions} transaction{category._count.transactions !== 1 ? 's are' : ' is'} using this category.
                                                                </span>
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(category.id, category.name)}
                                                        >
                                                            Delete Category
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {categories.length === 0 && (
                <Card className="glass">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Tag className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <p className="text-sm text-muted-foreground">No categories yet</p>
                        <Button onClick={openCreateSheet} variant="outline" className="mt-4 gap-2">
                            <Plus className="h-4 w-4" />
                            Create First Category
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Edit/Create Sheet */}
            <Sheet open={isEditing} onOpenChange={setIsEditing}>
                <SheetContent className="sm:max-w-md bg-card border-ak-border">
                    <SheetHeader>
                        <SheetTitle>
                            {editingCategory ? 'Edit Category' : 'Create Category'}
                        </SheetTitle>
                        <SheetDescription>
                            {editingCategory
                                ? 'Update the category name or type'
                                : 'Add a new category for organizing transactions'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Software Subscriptions"
                                className="rounded-lg border-ak-border-2 glass"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-xs uppercase tracking-wider text-muted-foreground">
                                Type
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, type: value as 'INCOME' | 'EXPENSE' | 'TRANSFER' })
                                }
                            >
                                <SelectTrigger id="type" className="rounded-lg border-ak-border-2 glass">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INCOME">
                                        <span className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-ak-green" />
                                            Income
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="EXPENSE">
                                        <span className="flex items-center gap-2">
                                            <TrendingDown className="h-4 w-4 text-ak-red" />
                                            Expense
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="TRANSFER">
                                        <span className="flex items-center gap-2">
                                            <ArrowLeftRight className="h-4 w-4 text-ak-blue" />
                                            Transfer
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={!formData.name.trim()}
                            className="w-full rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium mt-6"
                        >
                            {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
