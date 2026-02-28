import { Badge } from '../primitives/Badge';
import type { BadgeVariant } from '../primitives/Badge';
import type { CreditNoteStatus } from '@akount/db';

const CREDIT_NOTE_STATUS_CONFIG: Record<CreditNoteStatus, { label: string; variant: BadgeVariant }> = {
    DRAFT: { label: 'Draft', variant: 'default' },
    APPROVED: { label: 'Approved', variant: 'info' },
    APPLIED: { label: 'Applied', variant: 'success' },
    VOIDED: { label: 'Voided', variant: 'locked' },
};

interface CreditNoteStatusBadgeProps {
    status: CreditNoteStatus;
}

export function CreditNoteStatusBadge({ status }: CreditNoteStatusBadgeProps) {
    const config = CREDIT_NOTE_STATUS_CONFIG[status] ?? CREDIT_NOTE_STATUS_CONFIG.DRAFT;
    return (
        <Badge
            variant={config.variant}
            size="sm"
            className={`rounded-lg px-2.5 font-semibold`}
        >
            {config.label}
        </Badge>
    );
}
