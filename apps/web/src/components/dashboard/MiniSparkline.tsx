'use client';

import { useId } from 'react';
import { sparkColorMap, type SparkColor } from '@/lib/dashboard/constants';

interface MiniSparklineProps {
    data: number[];
    color?: SparkColor;
    width?: number;
    height?: number;
}

/**
 * Reusable mini sparkline component
 * Renders a small area chart with gradient fill
 * Uses React.useId() to generate unique SVG gradient IDs (no collision)
 */
export function MiniSparkline({
    data,
    color = 'primary',
    width = 80,
    height = 24,
}: MiniSparklineProps) {
    const gradientId = useId();

    if (data.length < 2) return null;

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
    const colors = sparkColorMap[color];

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#${gradientId})`} />
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
