import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        href: string;
        variant?: 'default' | 'outline';
    };
    secondaryAction?: {
        label: string;
        href: string;
    };
    progress?: {
        current: number;
        total: number;
        label: string;
    };
    variant?: 'default' | 'compact';
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    progress,
    variant = 'default'
}: EmptyStateProps) {
    const isCompact = variant === 'compact';

    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center glass rounded-xl",
            isCompact ? "py-8 px-4" : "py-12 px-4"
        )}>
            <div className={cn(
                "rounded-full bg-ak-bg-3 flex items-center justify-center mb-4",
                isCompact ? "h-10 w-10" : "h-12 w-12"
            )}>
                <Icon className={cn(
                    "text-muted-foreground",
                    isCompact ? "h-5 w-5" : "h-6 w-6"
                )} />
            </div>

            <h3 className={cn(
                "font-heading font-medium mb-2",
                isCompact ? "text-base" : "text-lg"
            )}>
                {title}
            </h3>

            <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>

            {progress && (
                <div className="w-full max-w-xs mb-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{progress.label}</span>
                        <span className="font-mono">{progress.current}/{progress.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-ak-bg-3 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {(action || secondaryAction) && (
                <div className="flex items-center gap-3">
                    {action && (
                        <Button asChild variant={action.variant || "default"} className="gap-2">
                            <Link href={action.href}>{action.label}</Link>
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button asChild variant="ghost" size="sm">
                            <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
