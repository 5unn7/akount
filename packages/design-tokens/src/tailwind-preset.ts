/**
 * Akount Tailwind CSS Preset
 *
 * Maps design tokens to Tailwind theme extensions.
 * Uses CSS custom properties for runtime theming support.
 */

import type { Config } from 'tailwindcss';

export const akountPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: 'hsl(var(--ak-primary))',
          foreground: 'hsl(var(--ak-primary-foreground))',
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          700: '#C2410C',
        },
        // Secondary (AI) colors
        secondary: {
          DEFAULT: 'hsl(var(--ak-secondary))',
          foreground: 'hsl(var(--ak-secondary-foreground))',
          500: '#8B5CF6',
          700: '#6D28D9',
        },
        // Financial semantic colors
        finance: {
          income: 'var(--ak-finance-income, #10B981)',
          expense: 'var(--ak-finance-expense, #EF4444)',
          transfer: 'var(--ak-finance-transfer, #3B82F6)',
          liability: 'var(--ak-finance-liability, #F59E0B)',
          equity: 'var(--ak-finance-equity, #14B8A6)',
        },
        // AI accent colors
        ai: {
          DEFAULT: 'var(--ak-ai, #8B5CF6)',
          accent: 'var(--ak-ai-accent, rgba(139,92,246,0.10))',
          border: 'var(--ak-ai-border, rgba(139,92,246,0.35))',
        },
        // State colors
        state: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        // Background colors (use CSS vars for theme switching)
        background: {
          primary: 'var(--ak-bg-primary)',
          secondary: 'var(--ak-bg-secondary)',
          surface: 'var(--ak-bg-surface)',
          elevated: 'var(--ak-bg-elevated)',
        },
        // Text colors
        foreground: {
          primary: 'var(--ak-text-primary)',
          secondary: 'var(--ak-text-secondary)',
          muted: 'var(--ak-text-muted)',
        },
        // Border colors
        border: {
          DEFAULT: 'var(--ak-border-default)',
          subtle: 'var(--ak-border-subtle)',
          strong: 'var(--ak-border-strong)',
        },
      },
      fontFamily: {
        heading: ['Newsreader', 'serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
      },
      spacing: {
        // 4px grid system
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
      },
      borderRadius: {
        DEFAULT: 'var(--ak-radius, 10px)',
        sm: 'var(--ak-radius-sm, 6px)',
        md: 'var(--ak-radius-md, 10px)',
        lg: 'var(--ak-radius-lg, 14px)',
        xl: 'var(--ak-radius-xl, 18px)',
      },
      boxShadow: {
        'ak-sm': '0 1px 2px rgba(0,0,0,0.10)',
        'ak-md': '0 6px 18px rgba(0,0,0,0.18)',
        'ak-lg': '0 16px 40px rgba(0,0,0,0.22)',
      },
      transitionDuration: {
        fast: '120ms',
        normal: '180ms',
        slow: '240ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1.2)',
      },
    },
  },
};

export default akountPreset;
