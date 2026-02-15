import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorClasses = {
    default: 'text-foreground',
    income: 'text-ak-green',
    expense: 'text-ak-red',
    warning: 'text-primary',
    transfer: 'text-ak-blue',
} as const;

interface StatPillProps {
    label: string;
    value: string;
    color?: keyof typeof colorClasses;
    icon?: LucideIcon;
    badge?: string | number;
    className?: string;
}

export function StatPill({
    label,
    value,
    color = 'default',
    icon: Icon,
    badge,
    className,
}: StatPillProps) {
    return (
        <div
            className={cn(
                'glass rounded-lg px-4 py-3 flex items-center gap-3',
                className
            )}
        >
            {Icon && (
                <Icon className={cn('h-4 w-4', colorClasses[color])} />
            )}
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground leading-none mb-1">
                    {label}
                </span>
                <span className={cn('text-sm font-mono font-medium leading-none', colorClasses[color])}>
                    {value}
                </span>
            </div>
            {badge !== undefined && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                    {badge}
                </span>
            )}
        </div>
    );
}
