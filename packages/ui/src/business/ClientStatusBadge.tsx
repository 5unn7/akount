const BADGE_BASE = 'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold';

const CLIENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-ak-green/10 text-ak-green border-ak-green/20' },
    inactive: { label: 'Inactive', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

interface ClientStatusBadgeProps {
    status: string;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
    const config = CLIENT_STATUS_CONFIG[status] ?? CLIENT_STATUS_CONFIG.inactive;
    return (
        <span className={`${BADGE_BASE} ${config.className}`}>
            {config.label}
        </span>
    );
}
