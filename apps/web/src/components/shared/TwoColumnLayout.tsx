import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    /** Width of the right column (default: 340px) */
    rightWidth?: string;
}

/**
 * Two-column layout: main content + right sidebar.
 * Stacks vertically below lg breakpoint.
 */
export function TwoColumnLayout({
    children,
    className,
    rightWidth = '340px',
}: TwoColumnLayoutProps) {
    return (
        <div
            className={cn('grid grid-cols-1 lg:grid-cols-[1fr_var(--right-w)] gap-6', className)}
            style={{ '--right-w': rightWidth } as React.CSSProperties}
        >
            <div className="min-w-0 space-y-6">{children[0]}</div>
            <div className="space-y-5">{children[1]}</div>
        </div>
    );
}
