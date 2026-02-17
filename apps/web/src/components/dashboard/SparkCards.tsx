import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface SparkCardData {
    label: string;
    value: string;
    trend?: {
        direction: 'up' | 'down' | 'flat';
        text: string;
    };
    sparkline?: number[];
    color?: 'green' | 'red' | 'blue' | 'purple' | 'primary';
}

interface SparkCardsProps {
    cards: SparkCardData[];
    className?: string;
}

const sparkColorMap = {
    green: { stroke: 'var(--ak-green)', fill: 'var(--ak-green-fill)' },
    red: { stroke: 'var(--ak-red)', fill: 'var(--ak-red-fill)' },
    blue: { stroke: 'var(--ak-blue)', fill: 'var(--ak-blue-fill)' },
    purple: { stroke: 'var(--ak-purple)', fill: 'var(--ak-purple-fill)' },
    primary: { stroke: 'var(--ak-pri)', fill: 'var(--ak-pri-fill)' },
} as const;

const trendColorMap = {
    up: 'text-ak-green',
    down: 'text-ak-red',
    flat: 'text-muted-foreground',
} as const;

const TrendIcon = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

const glowMap = {
    green: 'hover:glow-success',
    red: 'hover:glow-danger',
    blue: 'hover:glow-blue',
    purple: 'hover:glow-purple',
    primary: 'hover:glow-primary',
} as const;

function MiniSparkline({ data, color = 'primary' }: { data: number[]; color?: SparkCardData['color'] }) {
    if (data.length < 2) return null;

    const width = 80;
    const height = 24;
    const padding = 1;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((v - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    });

    const polyline = points.join(' ');
    const fillPath = `M${padding},${height} ${points.join(' ')} ${width - padding},${height} Z`;
    const colors = sparkColorMap[color ?? 'primary'];

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0"
        >
            <defs>
                <linearGradient id={`spark-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#spark-grad-${color})`} />
            <polyline
                points={polyline}
                fill="none"
                stroke={colors.stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sparkline-path"
            />
        </svg>
    );
}

export function SparkCards({ cards, className }: SparkCardsProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3',
                className
            )}
        >
            {cards.map((card, i) => (
                <div
                    key={card.label}
                    className={cn(
                        'glass rounded-lg px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px fi',
                        `fi${Math.min(i + 1, 6)}`,
                        glowMap[card.color ?? 'primary']
                    )}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1.5">
                                {card.label}
                            </p>
                            <p className="text-lg font-mono font-semibold leading-none">
                                {card.value}
                            </p>
                        </div>
                        {card.sparkline && card.sparkline.length > 1 && (
                            <div className="shrink-0 w-20">
                                <MiniSparkline data={card.sparkline} color={card.color} />
                            </div>
                        )}
                    </div>
                    {card.trend && (
                        <div
                            className={cn(
                                'flex items-center gap-1 mt-1.5',
                                trendColorMap[card.trend.direction]
                            )}
                        >
                            {(() => {
                                const Icon = TrendIcon[card.trend.direction];
                                return <Icon className="h-3 w-3" />;
                            })()}
                            <span className="text-[10px] font-medium">
                                {card.trend.text}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
