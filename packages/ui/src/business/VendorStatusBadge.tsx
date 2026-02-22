import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';

const VENDOR_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'success' },
    inactive: { label: 'Inactive', variant: 'locked' },
};

interface VendorStatusBadgeProps {
    status: string;
}

export function VendorStatusBadge({ status }: VendorStatusBadgeProps) {
    const config = VENDOR_STATUS_CONFIG[status] ?? VENDOR_STATUS_CONFIG.inactive;
    return (
        <Badge variant={config.variant} size="sm" className="rounded-lg px-2.5 font-semibold">
            {config.label}
        </Badge>
    );
}
