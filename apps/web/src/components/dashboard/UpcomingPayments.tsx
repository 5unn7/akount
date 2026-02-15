import { Calendar } from 'lucide-react';

interface Payment {
    id: string;
    name: string;
    meta: string;
    amount: string;
    date: { day: string; month: string };
    color?: 'red' | 'primary' | 'default';
}

interface UpcomingPaymentsProps {
    payments?: Payment[];
}

const colorMap = {
    red: 'text-ak-red',
    primary: 'text-primary',
    default: '',
} as const;

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Upcoming Payments
            </p>
            {!payments || payments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <Calendar className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">No upcoming payments</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {payments.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <div className="shrink-0 h-9 w-9 rounded-lg glass-2 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-mono font-semibold leading-none">
                                    {item.date.day}
                                </span>
                                <span className="text-[8px] uppercase text-muted-foreground leading-none mt-0.5">
                                    {item.date.month}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.meta}</p>
                            </div>
                            <span className={`text-xs font-mono font-medium shrink-0 ${colorMap[item.color ?? 'default']}`}>
                                {item.amount}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
