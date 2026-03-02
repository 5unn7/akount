'use client';

import { useState } from 'react';
import type { Category } from '@/lib/api/categories';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Plus, X, ChevronDown } from 'lucide-react';

interface CategorySelectorProps {
    currentCategory?: { id: string; name: string } | null;
    categories: Category[];
    onSelect: (categoryId: string | null) => void;
    onCreateNew?: (name: string, type: 'INCOME' | 'EXPENSE' | 'TRANSFER') => void;
    disabled?: boolean;
}

export function CategorySelector({
    currentCategory,
    categories,
    onSelect,
    onCreateNew,
    disabled,
}: CategorySelectorProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Group by type
    const grouped = {
        EXPENSE: categories.filter((c) => c.type === 'EXPENSE'),
        INCOME: categories.filter((c) => c.type === 'INCOME'),
        TRANSFER: categories.filter((c) => c.type === 'TRANSFER'),
    };

    function handleCreateNew() {
        if (!newCategoryName.trim() || !onCreateNew) return;
        onCreateNew(newCategoryName.trim(), 'EXPENSE');
        setNewCategoryName('');
        setIsCreating(false);
    }

    if (isCreating) {
        return (
            <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                <Input
                    placeholder="Name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateNew();
                        if (e.key === 'Escape') setIsCreating(false);
                    }}
                    className="h-6 w-28 text-xs bg-transparent border-ak-border px-1.5"
                    autoFocus
                />
                <Button
                    size="sm"
                    onClick={handleCreateNew}
                    disabled={!newCategoryName.trim()}
                    className="h-6 px-1.5 rounded-md bg-primary hover:bg-ak-pri-hover text-black text-micro"
                >
                    Add
                </Button>
                <button
                    onClick={() => setIsCreating(false)}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={disabled}
                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs transition-colors cursor-pointer hover:bg-ak-bg-3 disabled:cursor-not-allowed disabled:opacity-50 border-ak-border"
                    onClick={(e) => e.stopPropagation()}
                >
                    {currentCategory ? (
                        <>
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[100px] truncate">{currentCategory.name}</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </>
                    ) : (
                        <>
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Categorize</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-card border-ak-border-2"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                {currentCategory && (
                    <>
                        <DropdownMenuItem
                            onClick={() => onSelect(null)}
                            className="text-xs text-muted-foreground gap-2 cursor-pointer"
                        >
                            <X className="h-3 w-3" />
                            Remove category
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-ak-border" />
                    </>
                )}

                {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => {
                    const items = grouped[type];
                    if (items.length === 0) return null;

                    return (
                        <div key={type}>
                            <DropdownMenuLabel className="text-micro uppercase tracking-wider text-muted-foreground py-1">
                                {type}
                            </DropdownMenuLabel>
                            {items.map((cat) => (
                                <DropdownMenuItem
                                    key={cat.id}
                                    onClick={() => onSelect(cat.id)}
                                    className={`text-xs gap-2 cursor-pointer ${
                                        currentCategory?.id === cat.id
                                            ? 'bg-ak-pri-dim text-primary'
                                            : ''
                                    }`}
                                >
                                    <Tag className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{cat.name}</span>
                                    {cat._count?.transactions !== undefined && cat._count.transactions > 0 && (
                                        <span className="ml-auto text-micro text-muted-foreground">
                                            {cat._count.transactions}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    );
                })}

                {categories.length === 0 && (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                        No categories yet
                    </div>
                )}

                {onCreateNew && (
                    <>
                        <DropdownMenuSeparator className="bg-ak-border" />
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                setIsCreating(true);
                            }}
                            className="text-xs gap-2 cursor-pointer text-primary"
                        >
                            <Plus className="h-3 w-3" />
                            Create new category
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
