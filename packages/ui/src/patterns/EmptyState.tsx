import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils';

export interface EmptyStateProps {
    /** Main message (e.g., "No invoices found") */
    title: string;
    /** Secondary message (e.g., "Create your first invoice to get started") */
    description?: string;
    /** Optional Lucide icon */
    icon?: LucideIcon;
    /** 'card' wraps in glass container; 'inline' renders bare content for embedding */
    variant?: 'card' | 'inline';
    /** Size affects padding, icon style, and text sizing */
    size?: 'sm' | 'md' | 'lg';
    /** Action content (buttons, links, forms) rendered below description */
    children?: ReactNode;
    /** Additional classes on the outermost element */
    className?: string;
}

const sizeConfig = {
    sm: {
        padding: 'py-8',
        iconWrapper: '',
        iconClass: 'h-8 w-8 text-muted-foreground/20',
        title: 'text-xs text-muted-foreground',
        description: 'text-xs text-muted-foreground mt-1',
        gap: 'gap-2',
    },
    md: {
        padding: 'p-12',
        iconWrapper: 'h-12 w-12 rounded-full bg-ak-bg-3 flex items-center justify-center mb-4',
        iconClass: 'h-6 w-6 text-muted-foreground',
        title: 'text-muted-foreground font-medium',
        description: 'text-sm text-muted-foreground mt-1',
        gap: 'gap-2',
    },
    lg: {
        padding: 'py-16',
        iconWrapper: 'p-4 rounded-full bg-primary/10 mb-4',
        iconClass: 'h-8 w-8 text-primary',
        title: 'text-lg font-heading font-normal mb-2',
        description: 'text-sm text-muted-foreground mb-6 max-w-sm',
        gap: 'gap-3',
    },
} as const;

/**
 * EmptyState component for displaying "no data" states across the app.
 *
 * @example Simple card (tables)
 * ```tsx
 * <EmptyState
 *   title="No invoices found"
 *   description="Create your first invoice to get started"
 * />
 * ```
 *
 * @example Inline with icon (widgets)
 * ```tsx
 * <EmptyState
 *   variant="inline"
 *   size="sm"
 *   icon={Receipt}
 *   title="No transactions yet"
 * />
 * ```
 *
 * @example Full featured with actions
 * ```tsx
 * <EmptyState
 *   size="lg"
 *   icon={BookOpen}
 *   title="No journal entries yet"
 *   description="Create your first manual journal entry."
 * >
 *   <Button onClick={handleCreate}>New Entry</Button>
 * </EmptyState>
 * ```
 */
export function EmptyState({
    title,
    description,
    icon: Icon,
    variant = 'card',
    size = 'md',
    children,
    className,
}: EmptyStateProps) {
    const config = sizeConfig[size];

    const content = (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center',
                config.padding,
                variant === 'inline' && className,
            )}
        >
            {Icon && (
                config.iconWrapper ? (
                    <div className={config.iconWrapper}>
                        <Icon className={config.iconClass} />
                    </div>
                ) : (
                    <Icon className={cn(config.iconClass, 'mx-auto mb-2')} />
                )
            )}
            <p className={config.title}>{title}</p>
            {description && (
                <p className={config.description}>{description}</p>
            )}
            {children && (
                <div className={cn('flex items-center', config.gap)}>
                    {children}
                </div>
            )}
        </div>
    );

    if (variant === 'inline') {
        return content;
    }

    return (
        <div className={cn('glass rounded-[14px]', className)}>
            {content}
        </div>
    );
}
