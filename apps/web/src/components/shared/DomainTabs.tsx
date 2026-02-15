'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
    label: string;
    href: string;
}

interface DomainTabsProps {
    tabs: Tab[];
    className?: string;
}

export function DomainTabs({ tabs, className }: DomainTabsProps) {
    const pathname = usePathname();

    return (
        <div
            className={cn(
                'flex items-center gap-1 overflow-x-auto scrollbar-none glass rounded-lg p-1',
                className
            )}
        >
            {tabs.map((tab) => {
                const isActive =
                    pathname === tab.href ||
                    (tab.href !== tabs[0]?.href && pathname.startsWith(tab.href + '/'));

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                            isActive
                                ? 'bg-ak-bg-4 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
