'use client';

import { useState, useCallback, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataPoint {
    date: string;
    value: number;
}

interface CashFlowChartProps {
    data?: DataPoint[];
    height?: number;
    className?: string;
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

export function CashFlowChart({ data, height = 170, className }: CashFlowChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string; date: string } | null>(null);

    const width = 600;
    const paddingTop = 10;
    const paddingBottom = 24;
    const paddingX = 0;

    const hasData = data && data.length > 0;

    const values = hasData ? data.map((d) => d.value) : [];
    const min = hasData ? Math.min(...values) * 0.95 : 0;
    const max = hasData ? Math.max(...values) * 1.05 : 1;
    const range = max - min || 1;

    const todayIndex = hasData ? Math.floor(data.length * 0.5) : 0;

    const points = hasData
        ? data.map((d, i) => {
            const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
            const y = paddingTop + (1 - (d.value - min) / range) * (height - paddingTop - paddingBottom);
            return { x, y, ...d };
        })
        : [];

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            const svg = svgRef.current;
            if (!svg || points.length === 0) return;
            const rect = svg.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * width;

            let closest = points[0];
            let minDist = Infinity;
            for (const p of points) {
                const dist = Math.abs(p.x - mouseX);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            }

            setTooltip({
                x: closest.x,
                y: closest.y,
                value: formatCompact(closest.value),
                date: closest.date,
            });
        },
        [points]
    );

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    if (!hasData) {
        return (
            <div className={cn('glass rounded-xl p-5', className)}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-heading font-normal">Cash Flow Projection</h3>
                    <span className="text-xs text-muted-foreground font-mono">60-day view</span>
                </div>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Cash flow chart will populate with transaction data</p>
                </div>
            </div>
        );
    }

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} L${points[points.length - 1].x},${height - paddingBottom} L${points[0].x},${height - paddingBottom} Z`;

    const todayX = points[todayIndex]?.x || width / 2;

    // X-axis labels (show ~6)
    const labelStep = Math.floor(data.length / 6);
    const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

    return (
        <div className={cn('glass rounded-xl p-5', className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-heading font-normal">Cash Flow Projection</h3>
                <span className="text-xs text-muted-foreground font-mono">60-day view</span>
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ height }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <defs>
                    <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ak-pri-dim)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--ak-pri-active)" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path d={areaPath} fill="url(#cfGrad)" />

                {/* Line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="var(--ak-pri)"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* "Today" vertical line */}
                <line
                    x1={todayX}
                    y1={paddingTop}
                    x2={todayX}
                    y2={height - paddingBottom}
                    stroke="url(#todayGrad)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                />
                <text
                    x={todayX}
                    y={height - paddingBottom + 14}
                    textAnchor="middle"
                    className="fill-primary text-[9px] font-mono"
                >
                    Today
                </text>

                {/* X-axis labels */}
                {xLabels.map((d, i) => {
                    const idx = data.indexOf(d);
                    const p = points[idx];
                    if (!p) return null;
                    return (
                        <text
                            key={i}
                            x={p.x}
                            y={height - 2}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[9px] font-mono"
                        >
                            {d.date}
                        </text>
                    );
                })}

                {/* Tooltip hover indicator */}
                {tooltip && (
                    <>
                        <line
                            x1={tooltip.x}
                            y1={paddingTop}
                            x2={tooltip.x}
                            y2={height - paddingBottom}
                            stroke="var(--ak-border-2)"
                            strokeWidth={1}
                        />
                        <circle cx={tooltip.x} cy={tooltip.y} r={4} fill="var(--ak-pri)" />
                        <circle cx={tooltip.x} cy={tooltip.y} r={6} fill="none" stroke="var(--ak-pri)" strokeWidth={1} opacity={0.4} />
                    </>
                )}
            </svg>

            {/* Tooltip card */}
            {tooltip && (
                <div
                    className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-lg bg-ak-bg-3 border border-ak-border-2 shadow-lg shadow-black/30"
                    style={{
                        left: `${(tooltip.x / width) * 100}%`,
                        top: '60px',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <p className="text-xs font-mono font-medium">{tooltip.value}</p>
                    <p className="text-[9px] text-muted-foreground">{tooltip.date}</p>
                </div>
            )}
        </div>
    );
}
