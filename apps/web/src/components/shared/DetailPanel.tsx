'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

interface DetailPanelProps {
    /** The searchParams key to watch (e.g., "panel") */
    paramKey?: string;
    /** Width of the panel */
    width?: string;
    /** Title shown in the panel header */
    title?: string;
    /** Subtitle shown below the title */
    subtitle?: string;
    /** Badge shown next to the title */
    badge?: ReactNode;
    /** Content to render inside the panel */
    children: ReactNode;
}

/**
 * Slide-out right panel driven by URL searchParams.
 *
 * Open: router.push('?panel=txn_123')
 * Close: router.push(pathname) (removes param)
 *
 * Usage:
 * ```tsx
 * const panelId = searchParams.get('panel');
 * {panelId && (
 *   <DetailPanel title="Transaction Detail">
 *     <TransactionDetail id={panelId} />
 *   </DetailPanel>
 * )}
 * ```
 */
export function DetailPanel({
    paramKey = 'panel',
    width = 'max-w-md',
    title,
    subtitle,
    badge,
    children,
}: DetailPanelProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const panelRef = useRef<HTMLDivElement>(null);

    const isOpen = !!searchParams.get(paramKey);

    const close = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(paramKey);
        const query = params.toString();
        router.push(query ? `?${query}` : window.location.pathname);
    }, [router, searchParams, paramKey]);

    // Escape key handler
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                close();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, close]);

    // Trap focus inside panel
    useEffect(() => {
        if (!isOpen || !panelRef.current) return;

        const firstFocusable = panelRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-ak-bg-0/45 transition-opacity"
                onClick={close}
                aria-hidden
            />

            {/* Panel */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Detail panel'}
                className={`fixed top-0 right-0 z-50 h-full ${width} w-full border-l border-ak-border glass-blur bg-ak-bg-1/95 shadow-2xl animate-in slide-in-from-right duration-250`}
                style={{ '--tw-animate-duration': '0.25s' } as React.CSSProperties}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-ak-border">
                    <div className="min-w-0">
                        {badge && <div className="mb-2">{badge}</div>}
                        {title && (
                            <h2 className="text-lg font-heading font-normal leading-tight truncate">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={close}
                        className="shrink-0 ml-4 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-ak-bg-3 transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Close panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-80px)] px-6 py-5">
                    {children}
                </div>
            </div>
        </>
    );
}

/**
 * A row within the detail panel — label + value pair with divider.
 */
export function DetailRow({
    label,
    value,
    mono,
    color,
}: {
    label: string;
    value: ReactNode;
    mono?: boolean;
    color?: string;
}) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-ak-border last:border-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span className={`text-sm ${mono ? 'font-mono' : ''} ${color || ''}`}>
                {value}
            </span>
        </div>
    );
}

/**
 * Action buttons row for the bottom of a detail panel.
 */
export function DetailActions({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-center gap-3 pt-4 mt-4 border-t border-ak-border">
            {children}
        </div>
    );
}
