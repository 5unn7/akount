import { cn } from '@/lib/utils';

interface ContentPanelProps {
    children: React.ReactNode;
    className?: string;
}

export function ContentPanel({ children, className }: ContentPanelProps) {
    return (
        <div
            className={cn(
                'glass rounded-xl p-4 md:p-6',
                className
            )}
        >
            {children}
        </div>
    );
}
