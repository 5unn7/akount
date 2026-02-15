import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    title: string;
    meta?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function SectionHeader({ title, meta, actions, className }: SectionHeaderProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-4 pb-3 border-b border-ak-border',
                className
            )}
        >
            <h3 className="text-base font-heading font-normal tracking-tight">
                {title}
            </h3>
            {meta && (
                <span className="text-xs font-mono text-muted-foreground">
                    {meta}
                </span>
            )}
            <div className="flex-1" />
            {actions && (
                <div className="flex items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
