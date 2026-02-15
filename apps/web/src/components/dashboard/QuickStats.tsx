import { BarChart3 } from 'lucide-react';

interface StatRow {
    label: string;
    value: string;
}

interface QuickStatsProps {
    stats?: StatRow[];
}

export function QuickStats({ stats }: QuickStatsProps) {
    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Quick Stats
            </p>
            {!stats || stats.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <BarChart3 className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Stats appear as you add data</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {stats.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between py-2 border-b border-ak-border last:border-0"
                        >
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                            <span className="text-xs font-mono font-medium">{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
