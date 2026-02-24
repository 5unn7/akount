import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';

const BILL_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant; className?: string }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    PENDING: { label: 'Pending', variant: 'info' },
    // Uses teal instead of info-blue to distinguish "Approved" (bill-specific state) from generic info states
    APPROVED: { label: 'Approved', variant: 'info', className: 'bg-ak-teal/10 text-ak-teal border-ak-teal/20' },
    PAID: { label: 'Paid', variant: 'success' },
    PARTIALLY_PAID: { label: 'Partial', variant: 'warning' },
    OVERDUE: { label: 'Overdue', variant: 'error' },
    CANCELLED: { label: 'Cancelled', variant: 'locked' },
};

interface BillStatusBadgeProps {
    status: string;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
    const config = BILL_STATUS_CONFIG[status] ?? BILL_STATUS_CONFIG.DRAFT;
    return (
        <Badge
            variant={config.variant}
            size="sm"
            className={`rounded-lg px-2.5 font-semibold ${config.className ?? ''}`}
        >
            {config.label}
        </Badge>
    );
}
