import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatItem {
    label: string;
    value: string;
    trend?: {
        direction: 'up' | 'down' | 'flat';
        text: string;
    };
    color?: 'default' | 'green' | 'red' | 'blue' | 'purple' | 'primary';
}

interface StatsGridProps {
    stats: StatItem[];
    columns?: 3 | 4 | 5;
    className?: string;
}

const colorMap = {
    default: '',
    green: 'text-ak-green',
    red: 'text-ak-red',
    blue: 'text-ak-blue',
    purple: 'text-ak-purple',
    primary: 'text-primary',
} as const;

const trendColorMap = {
    up: 'text-ak-green',
    down: 'text-ak-red',
    flat: 'text-muted-foreground',
} as const;

const TrendIcon = {
    up: ArrowUp,
    down: ArrowDown,
    flat: Minus,
} as const;

const columnClasses = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-3 lg:grid-cols-4',
    5: 'md:grid-cols-3 lg:grid-cols-5',
} as const;

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-3',
                columnClasses[columns],
                className
            )}
        >
            {stats.map((stat, i) => (
                <div
                    key={stat.label}
                    className={cn(
                        'glass rounded-lg px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px fi',
                        `fi${Math.min(i + 1, 6)}`
                    )}
                >
                    <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1.5">
                        {stat.label}
                    </p>
                    <p
                        className={cn(
                            'text-lg font-mono font-semibold leading-none',
                            colorMap[stat.color ?? 'default']
                        )}
                    >
                        {stat.value}
                    </p>
                    {stat.trend && (
                        <div
                            className={cn(
                                'flex items-center gap-1 mt-1.5',
                                trendColorMap[stat.trend.direction]
                            )}
                        >
                            {(() => {
                                const Icon = TrendIcon[stat.trend.direction];
                                return <Icon className="h-3 w-3" />;
                            })()}
                            <span className="text-[10px] font-medium">
                                {stat.trend.text}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
