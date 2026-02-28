'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/currency';

interface BarData {
    label: string;
    value: number; // in cents
    color: string; // CSS color value or variable
}

interface SimpleBarChartProps {
    data: BarData[];
    height?: number;
    currency?: string;
}

/** Pure SVG vertical bar chart — no external dependencies */
export function SimpleBarChart({ data, height = 192, currency = 'CAD' }: SimpleBarChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
    if (maxValue === 0) return null;

    const barWidth = 48;
    const gap = 40;
    const labelHeight = 24;
    const topPad = 8;
    const chartHeight = height - labelHeight - topPad;
    const totalWidth = data.length * barWidth + (data.length - 1) * gap;

    return (
        <div className="w-full flex items-center justify-center" style={{ height }}>
            <svg
                width={totalWidth}
                height={height}
                viewBox={`0 0 ${totalWidth} ${height}`}
                role="img"
                aria-label="Bar chart"
            >
                {data.map((bar, i) => {
                    const x = i * (barWidth + gap);
                    const barHeight = (Math.abs(bar.value) / maxValue) * chartHeight;
                    const y = topPad + chartHeight - barHeight;

                    return (
                        <g
                            key={bar.label}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="cursor-pointer"
                        >
                            {/* Bar */}
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={4}
                                fill={bar.color}
                                opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.5}
                                className="transition-opacity duration-150"
                            />

                            {/* Value label on hover */}
                            {hoveredIdx === i && (
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 6}
                                    textAnchor="middle"
                                    className="fill-foreground text-xs font-mono"
                                >
                                    {formatCurrency(bar.value, currency)}
                                </text>
                            )}

                            {/* X-axis label */}
                            <text
                                x={x + barWidth / 2}
                                y={height - 4}
                                textAnchor="middle"
                                className="fill-muted-foreground text-xs"
                            >
                                {bar.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
