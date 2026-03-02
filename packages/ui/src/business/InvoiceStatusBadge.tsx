import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';
import type { InvoiceStatus } from '@akount/db';

// DRY-20: Type-safe config using InvoiceStatus enum
const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    SENT: { label: 'Sent', variant: 'info' },
    PAID: { label: 'Paid', variant: 'success' },
    PARTIALLY_PAID: { label: 'Partial', variant: 'warning' },
    OVERDUE: { label: 'Overdue', variant: 'error' },
    CANCELLED: { label: 'Cancelled', variant: 'locked' },
    VOIDED: { label: 'Voided', variant: 'error' },
};

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus; // Type-safe enum instead of string
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
    const config = INVOICE_STATUS_CONFIG[status] ?? INVOICE_STATUS_CONFIG.DRAFT;
    return (
        <Badge variant={config.variant} size="sm" className="rounded-lg px-2.5 font-semibold">
            {config.label}
        </Badge>
    );
}
