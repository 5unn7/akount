import type { Config } from "tailwindcss";
import { akountPreset } from "@akount/design-tokens/tailwind";

const config: Config = {
    darkMode: ["class"],
    presets: [akountPreset],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
            },
            fontFamily: {
                heading: ["var(--font-heading)"],
                sans: ["var(--font-body)"],
                mono: ["var(--font-mono)"],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                // Financial semantic colors from design-tokens
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
                }
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
