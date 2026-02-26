import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';

type AIActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'EXPIRED';

const AI_ACTION_STATUS_CONFIG: Record<AIActionStatus, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: 'Pending', variant: 'warning' },
    APPROVED: { label: 'Approved', variant: 'success' },
    REJECTED: { label: 'Rejected', variant: 'error' },
    MODIFIED: { label: 'Modified', variant: 'info' },
    EXPIRED: { label: 'Expired', variant: 'locked' },
};

interface AIActionStatusBadgeProps {
    status: AIActionStatus;
}

export function AIActionStatusBadge({ status }: AIActionStatusBadgeProps) {
    const config = AI_ACTION_STATUS_CONFIG[status] ?? AI_ACTION_STATUS_CONFIG.PENDING;
    return (
        <Badge variant={config.variant} size="sm" className="rounded-lg px-2.5 font-semibold">
            {config.label}
        </Badge>
    );
}
