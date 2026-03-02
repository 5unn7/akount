import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';

const JE_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
    DRAFT: { label: 'Draft', variant: 'warning' },
    POSTED: { label: 'Posted', variant: 'success' },
    VOIDED: { label: 'Voided', variant: 'error' },
    ARCHIVED: { label: 'Archived', variant: 'default' },
};

interface JournalEntryStatusBadgeProps {
    status: string;
}

export function JournalEntryStatusBadge({ status }: JournalEntryStatusBadgeProps) {
    const config = JE_STATUS_CONFIG[status] ?? JE_STATUS_CONFIG.DRAFT;
    return (
        <Badge variant={config.variant} size="sm" className="rounded-lg px-2.5 font-semibold">
            {config.label}
        </Badge>
    );
}
