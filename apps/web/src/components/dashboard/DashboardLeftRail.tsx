'use client';

import { useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardData {
    label: string;
    value: string;
    trend?: {
        direction: 'up' | 'down' | 'flat';
        text: string;
    };
    sparkline?: number[];
    color?: 'green' | 'red' | 'blue' | 'purple' | 'primary';
}

interface DashboardLeftRailProps {
    stats: StatCardData[];
}

const colorMap = {
    green: 'text-ak-green',
    red: 'text-ak-red',
    blue: 'text-ak-blue',
    purple: 'text-ak-purple',
    primary: 'text-primary',
} as const;

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

const glowColorMap = {
    green: 'var(--ak-green-fill)',
    red: 'var(--ak-red-fill)',
    blue: 'var(--ak-blue-fill)',
    purple: 'var(--ak-purple-fill)',
    primary: 'var(--ak-pri-fill)',
} as const;

const TrendIcon = { up: TrendingUp, down: TrendingDown, flat: Minus } as const;

function MiniSparkline({ data, color = 'primary' }: { data: number[]; color?: StatCardData['color'] }) {
    if (data.length < 2) return null;

    const width = 56;
    const height = 20;
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
            className="shrink-0 opacity-70"
        >
            <defs>
                <linearGradient id={`rail-spark-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#rail-spark-grad-${color})`} />
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

function StatCard({ stat, index }: { stat: StatCardData; index: number }) {
    const frameRef = useRef<number>(0);
    const Icon = stat.trend ? TrendIcon[stat.trend.direction] : null;
    const trendColor = stat.trend ? trendColorMap[stat.trend.direction] : '';
    const glowColor = glowColorMap[stat.color ?? 'primary'];

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const clientX = e.clientX;
        const clientY = e.clientY;

        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
            const rect = target.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            target.style.setProperty('--glow-x', `${x}%`);
            target.style.setProperty('--glow-y', `${y}%`);
        });
    }, []);

    return (
        <div
            className={cn(
                'glass rounded-lg px-3 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px cursor-pointer glow-track fi',
                `fi${Math.min(index + 1, 6)}`
            )}
            style={{ '--glow-color': glowColor } as React.CSSProperties}
            onMouseMove={handleMouseMove}
        >
            <div className="flex items-start justify-between mb-2">
                <p className="text-[9px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    {stat.label}
                </p>
                {stat.sparkline && stat.sparkline.length > 1 && (
                    <MiniSparkline data={stat.sparkline} color={stat.color} />
                )}
            </div>
            <p className={cn(
                'text-2xl font-mono font-semibold leading-none mb-2',
                stat.color ? colorMap[stat.color] : 'text-foreground'
            )}>
                {stat.value}
            </p>
            {stat.trend && Icon && (
                <div className={cn('flex items-center gap-1', trendColor)}>
                    <Icon className="h-3 w-3" />
                    <span className="text-[10px] font-medium">
                        {stat.trend.text}
                    </span>
                </div>
            )}
        </div>
    );
}

export function DashboardLeftRail({ stats }: DashboardLeftRailProps) {
    return (
        <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-6 space-y-2 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin">
                <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium px-3 mb-3">
                    Quick Stats
                </h3>
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </div>
        </aside>
    );
}
