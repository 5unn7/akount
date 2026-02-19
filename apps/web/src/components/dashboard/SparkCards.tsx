'use client';

import { useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';
import {
    trendColorMap,
    glowColorMap,
    type StatCardData,
} from '@/lib/dashboard/constants';

interface SparkCardsProps {
    cards: StatCardData[];
    className?: string;
}

const TrendIcon = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

function SparkCard({ card, index }: { card: StatCardData; index: number }) {
    const frameRef = useRef<number>(0);
    const glowColor = glowColorMap[card.color ?? 'primary'];

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
                'glass rounded-lg px-4 py-3.5 transition-all hover:border-ak-border-2 hover:-translate-y-px glow-track fi',
                `fi${Math.min(index + 1, 6)}`
            )}
            style={{ '--glow-color': glowColor } as React.CSSProperties}
            onMouseMove={handleMouseMove}
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
                        <MiniSparkline
                            data={card.sparkline}
                            color={card.color}
                            gradientId={`spark-grad-${card.color}-${index}`}
                        />
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
                <SparkCard key={card.label} card={card} index={i} />
            ))}
        </div>
    );
}
