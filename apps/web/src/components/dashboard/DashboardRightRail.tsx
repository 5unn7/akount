import { cn } from '@/lib/utils';
import { AIBrief } from './AIBrief';
import { QuickActions } from './QuickActions';
import { ActionItems } from './ActionItems';
import { UpcomingPayments } from './UpcomingPayments';

interface DashboardRightRailProps {
    className?: string;
}

export function DashboardRightRail({ className }: DashboardRightRailProps) {
    const isDesktopRail = !className?.includes('w-full');

    return (
        <aside className={cn("hidden xl:block w-80 shrink-0", className)}>
            <div className="xl:sticky xl:top-6 space-y-3">
                {isDesktopRail && (
                    <div className="h-8" aria-hidden="true" />
                )}
                <AIBrief />
                <QuickActions />
                <ActionItems />
                <UpcomingPayments />
            </div>
        </aside>
    );
}
