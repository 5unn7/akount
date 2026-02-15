interface StatRow {
    label: string;
    value: string;
}

interface QuickStatsProps {
    stats?: StatRow[];
}

const MOCK_STATS: StatRow[] = [
    { label: 'Invoices Sent (MTD)', value: '7' },
    { label: 'Avg Collection Days', value: '18' },
    { label: 'Recurring Revenue', value: '$4,200/mo' },
    { label: 'Tax Obligation (Q1)', value: '$3,420' },
    { label: 'Next Fiscal Close', value: 'Mar 31' },
];

export function QuickStats({ stats }: QuickStatsProps) {
    const items = stats || MOCK_STATS;

    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Quick Stats
            </p>
            <div className="space-y-0">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center justify-between py-2 border-b border-ak-border last:border-0"
                    >
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-mono font-medium">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
