import { QuickActionPills } from './QuickActionPills';
import { UpcomingPayments } from './UpcomingPayments';

export function CommandCenterRightPanel() {
    return (
        <div className="glass rounded-xl p-4 flex flex-col gap-3 h-full">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                Quick Actions
            </p>
            <QuickActionPills />
            <div className="mt-auto">
                <UpcomingPayments />
            </div>
        </div>
    );
}
