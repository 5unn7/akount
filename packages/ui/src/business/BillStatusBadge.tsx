const BADGE_BASE = 'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold';

const BILL_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-ak-bg-3 text-muted-foreground border-ak-border' },
    PENDING: { label: 'Pending', className: 'bg-ak-blue/10 text-ak-blue border-ak-blue/20' },
    APPROVED: { label: 'Approved', className: 'bg-ak-teal/10 text-ak-teal border-ak-teal/20' },
    PAID: { label: 'Paid', className: 'bg-ak-green/10 text-ak-green border-ak-green/20' },
    PARTIALLY_PAID: { label: 'Partial', className: 'bg-primary/10 text-primary border-primary/20' },
    OVERDUE: { label: 'Overdue', className: 'bg-ak-red/10 text-ak-red border-ak-red/20' },
    CANCELLED: { label: 'Cancelled', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

interface BillStatusBadgeProps {
    status: string;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
    const config = BILL_STATUS_CONFIG[status] ?? BILL_STATUS_CONFIG.DRAFT;
    return (
        <span className={`${BADGE_BASE} ${config.className}`}>
            {config.label}
        </span>
    );
}
