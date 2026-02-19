import Link from 'next/link';
import { FileText, Camera, Receipt, ArrowRightLeft, type LucideIcon } from 'lucide-react';

interface QuickAction {
    label: string;
    href: string;
    icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
    { label: 'Invoice', href: '/business/invoices', icon: FileText },
    { label: 'Scan Receipt', href: '/banking/imports', icon: Camera },
    { label: 'New Bill', href: '/business/bills', icon: Receipt },
    { label: 'Transfer', href: '/banking/transfers', icon: ArrowRightLeft },
];

export function QuickActions() {
    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg glass-2 hover:bg-ak-bg-3 hover:border-ak-border-2 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                        <action.icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
