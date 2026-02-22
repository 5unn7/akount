const BADGE_BASE = 'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold';

const JE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    DRAFT: { label: 'Draft', className: 'bg-ak-pri-dim text-primary border-primary/20' },
    POSTED: { label: 'Posted', className: 'bg-ak-green-dim text-ak-green border-ak-green/20' },
    VOIDED: { label: 'Voided', className: 'bg-ak-red-dim text-ak-red border-ak-red/20' },
    ARCHIVED: { label: 'Archived', className: 'bg-muted/50 text-muted-foreground border-muted-foreground/20' },
};

interface JournalEntryStatusBadgeProps {
    status: string;
}

export function JournalEntryStatusBadge({ status }: JournalEntryStatusBadgeProps) {
    const config = JE_STATUS_CONFIG[status] ?? JE_STATUS_CONFIG.DRAFT;
    return (
        <span className={`${BADGE_BASE} ${config.className}`}>
            {config.label}
        </span>
    );
}
