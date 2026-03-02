import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';
import type { BillStatus } from '@akount/db';

// DRY-20: Type-safe config using BillStatus enum
const BILL_STATUS_CONFIG: Record<BillStatus, { label: string; variant: BadgeVariant; className?: string }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    PENDING: { label: 'Pending', variant: 'info' },
    PAID: { label: 'Paid', variant: 'success' },
    PARTIALLY_PAID: { label: 'Partial', variant: 'warning' },
    OVERDUE: { label: 'Overdue', variant: 'error' },
    CANCELLED: { label: 'Cancelled', variant: 'locked' },
    // Note: APPROVED removed - not in Prisma BillStatus enum
};

interface BillStatusBadgeProps {
    status: BillStatus; // Type-safe enum instead of string
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
