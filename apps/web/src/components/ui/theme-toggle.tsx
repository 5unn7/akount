'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />;
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={cn(
                "relative h-8 w-8 rounded-full overflow-hidden shrink-0 cursor-pointer",
                "transition-all duration-500 ease-[var(--ak-ease)]",
                "hover:scale-110 active:scale-95",
                "ring-1 ring-inset shadow-sm",
                isDark
                    ? "bg-ak-bg-3 ring-ak-border hover:ring-ak-border-2"
                    : "bg-gradient-to-b from-sky-300 to-sky-400 ring-black/5 hover:ring-black/10"
            )}
        >
            {/* Moon + stars — visible in dark mode */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-all duration-500 ease-[var(--ak-ease)]",
                isDark
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 rotate-[120deg] scale-0"
            )}>
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path
                        d="M9.2 3.1C5.7 3.6 3 6.7 3 10.4c0 4 3.2 7.1 7.1 6.5 2.9-.4 5.2-2.7 5.8-5.5-1 .5-2.1.7-3.3.4-2.5-.6-4.3-2.9-4.1-5.5.1-1.1.5-2.1 1.1-2.9-.1-.1-.2-.2-.4-.3z"
                        fill="#FEF9C3"
                    />
                    <circle cx="15" cy="5" r="0.7" fill="white" opacity="0.9">
                        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="6" cy="6" r="0.5" fill="white" opacity="0.6">
                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="16" cy="12" r="0.4" fill="white" opacity="0.5">
                        <animate attributeName="opacity" values="0.5;0.15;0.5" dur="4s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>

            {/* Sun + rays — visible in light mode */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                "transition-all duration-500 ease-[var(--ak-ease)]",
                isDark
                    ? "opacity-0 -rotate-[120deg] scale-0"
                    : "opacity-100 rotate-0 scale-100"
            )}>
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true">
                    <circle cx="10" cy="10" r="3.5" fill="#FBBF24" />
                    <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" className="origin-center">
                        <line x1="10" y1="3" x2="10" y2="5" />
                        <line x1="10" y1="15" x2="10" y2="17" />
                        <line x1="3" y1="10" x2="5" y2="10" />
                        <line x1="15" y1="10" x2="17" y2="10" />
                        <line x1="5.05" y1="5.05" x2="6.46" y2="6.46" />
                        <line x1="13.54" y1="13.54" x2="14.95" y2="14.95" />
                        <line x1="5.05" y1="14.95" x2="6.46" y2="13.54" />
                        <line x1="13.54" y1="6.46" x2="14.95" y2="5.05" />
                    </g>
                    {/* Tiny cloud hint */}
                    <ellipse cx="15" cy="15" rx="2.5" ry="1.2" fill="white" opacity="0.4" />
                </svg>
            </div>
        </button>
    );
}
