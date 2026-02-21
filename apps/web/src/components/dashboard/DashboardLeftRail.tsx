'use client';

import { useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiniSparkline } from './MiniSparkline';
import {
    colorMap,
    trendColorMap,
    glowColorMap,
    type StatCardData,
} from '@/lib/dashboard/constants';

interface DashboardLeftRailProps {
    stats: StatCardData[];
}

const TrendIcon = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

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

    useEffect(() => {
        return () => {
            cancelAnimationFrame(frameRef.current);
        };
    }, []);

    return (
        <div
            className={cn(
                'glass rounded-lg px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px cursor-pointer glow-track fi',
                `fi${Math.min(index + 1, 6)}`
            )}
            style={{ '--glow-color': glowColor } as React.CSSProperties}
            onMouseMove={handleMouseMove}
        >
            <div className="flex items-start justify-between mb-2 h-5">
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                    {stat.label}
                </p>
                <div className="opacity-70 w-14 h-5">
                    {stat.sparkline && stat.sparkline.length > 1 && (
                        <MiniSparkline
                            data={stat.sparkline}
                            color={stat.color}
                            width={56}
                            height={20}
                        />
                    )}
                </div>
            </div>
            <p className={cn(
                'text-3xl font-mono font-semibold leading-none mb-2',
                stat.color ? colorMap[stat.color] : 'text-foreground'
            )}>
                {stat.value}
            </p>
            <div className={cn('flex items-center gap-1 h-4', stat.trend && Icon ? trendColor : 'text-transparent')}>
                {stat.trend && Icon ? (
                    <>
                        <Icon className="h-3 w-3" />
                        <span className="text-[10px] font-medium">
                            {stat.trend.text}
                        </span>
                    </>
                ) : (
                    <span className="text-[10px]">&nbsp;</span>
                )}
            </div>
        </div>
    );
}

export function DashboardLeftRail({ stats }: DashboardLeftRailProps) {
    return (
        <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-6 space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium px-3 flex items-end h-8">
                    Quick Stats
                </h3>
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </div>
        </aside>
    );
}
