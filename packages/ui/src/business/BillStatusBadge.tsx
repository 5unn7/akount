import { Badge } from '../ui/badge';

const BILL_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    PENDING: { label: 'Pending', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    APPROVED: { label: 'Approved', className: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
    PAID: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    PARTIALLY_PAID: { label: 'Partial', className: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
    OVERDUE: { label: 'Overdue', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
};

interface BillStatusBadgeProps {
    status: string;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
    const config = BILL_STATUS_CONFIG[status] ?? BILL_STATUS_CONFIG.DRAFT;
    return (
        <Badge variant="outline" className={config.className}>
            {config.label}
        </Badge>
    );
}
