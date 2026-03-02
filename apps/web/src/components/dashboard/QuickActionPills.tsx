import Link from 'next/link';
import {
    FileText,
    Receipt,
    Camera,
    CreditCard,
    ArrowRightLeft,
    BookOpen,
    type LucideIcon,
} from 'lucide-react';

interface QuickAction {
    label: string;
    href: string;
    icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
    { label: 'Invoice', href: '/business/invoices', icon: FileText },
    { label: 'New Bill', href: '/business/bills', icon: Receipt },
    { label: 'Scan Receipt', href: '/banking/imports', icon: Camera },
    { label: 'Record Payment', href: '/business/payments', icon: CreditCard },
    { label: 'Transfer', href: '/banking/transfers', icon: ArrowRightLeft },
    { label: 'Journal Entry', href: '/accounting/journal-entries', icon: BookOpen },
];

export function QuickActionPills() {
    return (
        <div className="relative">
            {/* Fade edge — right side on mobile */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 sm:hidden" />
            <div className="flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 overflow-x-auto [-webkit-overflow-scrolling:touch] scrollbar-hide pb-1 sm:pb-0">
                {ACTIONS.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg glass-2 border border-ak-border whitespace-nowrap hover:glass-3 hover:-translate-y-px transition-all text-sm text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <action.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-medium">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
