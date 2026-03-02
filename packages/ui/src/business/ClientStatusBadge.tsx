import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';

const CLIENT_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'locked' },
};

interface ClientStatusBadgeProps {
    status: string;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
    const config = CLIENT_STATUS_CONFIG[status] ?? CLIENT_STATUS_CONFIG.inactive;
    return (
        <Badge variant={config.variant} size="sm" className="rounded-lg px-2.5 font-semibold">
            {config.label}
        </Badge>
    );
}
