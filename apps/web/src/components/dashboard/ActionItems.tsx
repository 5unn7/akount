import Link from 'next/link';
import { ArrowRight, CheckCircle2, type LucideIcon } from 'lucide-react';

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

export function ActionItems({ items }: ActionItemsProps) {
    return (
        <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Action Items
            </p>
            {!items || items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <CheckCircle2 className="h-6 w-6 text-ak-green/50" />
                    <p className="text-xs text-muted-foreground">You&apos;re all caught up</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((item) => (
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
            )}
        </div>
    );
}
