'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trash2, X, Loader2, Tag, Tags } from 'lucide-react';

interface CategoryOption {
    id: string;
    name: string;
    type?: string;
}

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkUncategorize: () => Promise<void>;
    onBulkDelete: () => Promise<void>;
    onBulkCategorize?: (categoryId: string) => Promise<void>;
    categories?: CategoryOption[];
    extraActions?: React.ReactNode;
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onBulkUncategorize,
    onBulkDelete,
    onBulkCategorize,
    categories = [],
    extraActions,
}: BulkActionBarProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUncategorizing, setIsUncategorizing] = useState(false);
    const [isCategorizing, setIsCategorizing] = useState(false);

    if (selectedCount === 0) return null;

    async function handleDelete() {
        setIsDeleting(true);
        try {
            await onBulkDelete();
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleUncategorize() {
        setIsUncategorizing(true);
        try {
            await onBulkUncategorize();
        } finally {
            setIsUncategorizing(false);
        }
    }

    async function handleCategorize(categoryId: string) {
        if (!onBulkCategorize) return;
        setIsCategorizing(true);
        try {
            await onBulkCategorize(categoryId);
        } finally {
            setIsCategorizing(false);
        }
    }

    const busy = isDeleting || isUncategorizing || isCategorizing;

    return (
        <div className="sticky bottom-6 z-40 flex justify-center">
            <div className="flex items-center gap-3 px-4 py-2.5 glass-2 rounded-lg border border-ak-border-2 shadow-lg shadow-black/20">
                {/* Selection count */}
                <span className="text-sm font-medium tabular-nums">
                    {selectedCount} selected
                </span>

                <div className="h-4 w-px bg-ak-border-2" />

                {/* Categorize (inline dropdown) */}
                {onBulkCategorize && categories.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        {isCategorizing ? (
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" disabled>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Categorizing...
                            </Button>
                        ) : (
                            <Select onValueChange={handleCategorize} disabled={busy}>
                                <SelectTrigger className="h-8 w-[140px] text-xs glass-2 rounded-lg border-ak-border">
                                    <Tags className="h-3.5 w-3.5 mr-1.5" />
                                    <SelectValue placeholder="Categorize" />
                                </SelectTrigger>
                                <SelectContent className="glass-2 rounded-lg border-ak-border-2 max-h-60">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <span className="text-xs">{cat.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}

                {/* Uncategorize */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-xs hover:bg-ak-bg-3"
                    onClick={handleUncategorize}
                    disabled={busy}
                >
                    {isUncategorizing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                        <Tag className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Uncategorize
                </Button>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-xs text-ak-red hover:bg-ak-red/10 hover:text-ak-red"
                    onClick={handleDelete}
                    disabled={busy}
                >
                    {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Delete
                </Button>

                {extraActions && (
                    <>
                        <div className="h-4 w-px bg-ak-border-2" />
                        {extraActions}
                    </>
                )}

                <div className="h-4 w-px bg-ak-border-2" />

                {/* Clear */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-ak-bg-3"
                    onClick={onClearSelection}
                    disabled={busy}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
