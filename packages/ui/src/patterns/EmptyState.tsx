import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface EmptyStateProps {
    /**
     * The main message (e.g., "No invoices found")
     */
    title: string;

    /**
     * Secondary message (e.g., "Create your first invoice to get started")
     */
    description?: string;

    /**
     * Optional icon to display
     */
    icon?: LucideIcon;

    /**
     * Icon size (default: 'h-8 w-8')
     */
    iconSize?: string;
}

/**
 * EmptyState component for displaying "no data" states across the app.
 * Consolidates the consistent pattern: Card → icon + title → description
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No invoices found"
 *   description="Create your first invoice to get started"
 *   icon={FileText}
 * />
 * ```
 */
export function EmptyState({
    title,
    description,
    icon: Icon,
    iconSize = 'h-8 w-8',
}: EmptyStateProps) {
    return (
        <Card className="glass rounded-[14px]">
            <CardContent className="p-12 text-center">
                {Icon && (
                    <Icon className={`${iconSize} text-muted-foreground/20 mx-auto mb-4`} />
                )}
                <p className="text-muted-foreground font-medium">{title}</p>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
