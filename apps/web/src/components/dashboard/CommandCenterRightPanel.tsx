import { QuickActionPills } from './QuickActionPills';
import { UpcomingPayments } from './UpcomingPayments';

export function CommandCenterRightPanel() {
    return (
        <div className="glass rounded-xl p-4 flex flex-col gap-3 h-full">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                Quick Actions
            </p>
            <QuickActionPills />
            <div className="border-t border-ak-border pt-3 mt-1 flex-1 min-h-0">
                <UpcomingPayments />
            </div>
        </div>
    );
}
