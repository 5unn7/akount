/**
 * Dashboard Component Shared Constants
 *
 * Centralized color mappings and type definitions used across
 * SparkCards and DashboardLeftRail components.
 */

export type SparkColor = 'green' | 'red' | 'blue' | 'purple' | 'primary' | 'teal';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendData {
    direction: TrendDirection;
    text: string;
}

export interface StatCardData {
    label: string;
    value: string;
    trend?: TrendData;
    sparkline?: number[];
    color?: SparkColor;
    href?: string;
}

/**
 * Sparkline stroke and fill colors mapped to design tokens
 */
export const sparkColorMap = {
    green: { stroke: 'var(--ak-green)', fill: 'var(--ak-green-fill)' },
    red: { stroke: 'var(--ak-red)', fill: 'var(--ak-red-fill)' },
    blue: { stroke: 'var(--ak-blue)', fill: 'var(--ak-blue-fill)' },
    purple: { stroke: 'var(--ak-purple)', fill: 'var(--ak-purple-fill)' },
    primary: { stroke: 'var(--ak-pri)', fill: 'var(--ak-pri-fill)' },
    teal: { stroke: 'var(--ak-teal)', fill: 'var(--ak-teal-fill)' },
} as const;

/**
 * Trend indicator text colors
 */
export const trendColorMap = {
    up: 'text-ak-green',
    down: 'text-ak-red',
    flat: 'text-muted-foreground',
} as const;

/**
 * Glow effect colors for interactive cards
 */
export const glowColorMap = {
    green: 'var(--ak-green-fill)',
    red: 'var(--ak-red-fill)',
    blue: 'var(--ak-blue-fill)',
    purple: 'var(--ak-purple-fill)',
    primary: 'var(--ak-pri-fill)',
    teal: 'var(--ak-teal-fill)',
} as const;

/**
 * Text color classes for value display
 */
export const colorMap = {
    green: 'text-ak-green',
    red: 'text-ak-red',
    blue: 'text-ak-blue',
    purple: 'text-ak-purple',
    primary: 'text-primary',
    teal: 'text-ak-teal',
} as const;