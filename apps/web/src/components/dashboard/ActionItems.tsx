import Link from 'next/link';
import { AlertCircle, FileText, Receipt, ArrowRight, type LucideIcon } from 'lucide-react';

interface ActionItem {
    id: string;
    title: string;
    meta: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    href: string;
    actionLabel: string;
}

interface ActionItemsProps {
    items?: ActionItem[];
}

const MOCK_ITEMS: ActionItem[] = [
    {
        id: '1',
        title: 'Review uncategorized transactions',
        meta: '12 transactions need attention',
        icon: AlertCircle,
        iconColor: 'text-primary',
        iconBg: 'bg-ak-pri-dim',
        href: '/banking/transactions?filter=uncategorized',
        actionLabel: 'Review',
    },
    {
        id: '2',
        title: 'Outstanding invoice — Maple Corp',
        meta: '$4,200.00 CAD · Due Feb 28',
        icon: FileText,
        iconColor: 'text-ak-blue',
        iconBg: 'bg-ak-blue-dim',
        href: '/business/invoices',
        actionLabel: 'Send',
    },
    {
        id: '3',
        title: 'Upcoming bill payment',
        meta: '$890.00 CAD · Adobe Creative Cloud',
        icon: Receipt,
        iconColor: 'text-ak-purple',
        iconBg: 'bg-ak-purple-dim',
        href: '/business/bills',
        actionLabel: 'Review',
    },
];

export function ActionItems({ items }: ActionItemsProps) {
    const actionItems = items || MOCK_ITEMS;

    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Action Items
            </p>
            <div className="space-y-2">
                {actionItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ak-bg-3/50 transition-colors group"
                    >
                        <div className={`shrink-0 h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                            <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.meta}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
