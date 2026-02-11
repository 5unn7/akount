'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, X, Loader2, Tag } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkUncategorize: () => Promise<void>;
    onBulkDelete: () => Promise<void>;
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onBulkUncategorize,
    onBulkDelete,
}: BulkActionBarProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUncategorizing, setIsUncategorizing] = useState(false);

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

    const busy = isDeleting || isUncategorizing;

    return (
        <div className="sticky bottom-6 z-40 flex justify-center">
            <div className="flex items-center gap-3 px-4 py-2.5 glass-2 rounded-xl border border-white/[0.09] shadow-lg shadow-black/20">
                {/* Selection count */}
                <span className="text-sm font-medium tabular-nums">
                    {selectedCount} selected
                </span>

                <div className="h-4 w-px bg-white/[0.09]" />

                {/* Uncategorize */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-xs hover:bg-white/[0.04]"
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
                    className="h-8 rounded-lg text-xs text-[#F87171] hover:bg-[#F87171]/10 hover:text-[#F87171]"
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

                <div className="h-4 w-px bg-white/[0.09]" />

                {/* Clear */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-white/[0.04]"
                    onClick={onClearSelection}
                    disabled={busy}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
