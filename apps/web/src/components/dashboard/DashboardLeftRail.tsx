'use client';

import type { StatCardData } from '@/lib/dashboard/constants';
import { StatCard } from './StatCard';

interface DashboardLeftRailProps {
    stats: StatCardData[];
}

export function DashboardLeftRail({ stats }: DashboardLeftRailProps) {
    return (
        <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-6 space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium px-3 flex items-end h-8">
                    Quick Stats
                </h3>
                {stats.map((stat, index) => (
                    <StatCard key={stat.label} stat={stat} index={index} />
                ))}
            </div>
        </aside>
    );
}
