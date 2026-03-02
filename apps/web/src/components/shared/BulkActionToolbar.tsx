'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkAction {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
}

interface BulkActionToolbarProps {
    count: number;
    actions: BulkAction[];
    onClear: () => void;
}

export function BulkActionToolbar({ count, actions, onClear }: BulkActionToolbarProps) {
    if (count === 0) return null;

    return (
        <div className="glass-2 rounded-xl border border-ak-border-2 px-4 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                    <span className="font-mono text-primary">{count}</span>{' '}
                    selected
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                </Button>
            </div>
            <div className="flex items-center gap-2">
                {actions.map((action) => (
                    <Button
                        key={action.label}
                        size="sm"
                        variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                        className="h-8 gap-1.5 text-xs"
                        onClick={action.onClick}
                        disabled={action.disabled}
                    >
                        {action.icon}
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    );
}
