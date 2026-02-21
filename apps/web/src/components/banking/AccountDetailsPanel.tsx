import type { Account } from '@/lib/api/accounts';
import { accountTypeLabels } from '@/lib/utils/account-helpers';

interface AccountDetailsPanelProps {
    account: Account;
    transactionCount: number;
    lastImportDate?: string;
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                {label}
            </span>
            <span className="text-xs font-mono">{value}</span>
        </div>
    );
}

export function AccountDetailsPanel({
    account,
    transactionCount,
    lastImportDate,
}: AccountDetailsPanelProps) {
    return (
        <div className="glass rounded-xl p-5">
            <h3 className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">
                Account Details
            </h3>
            <div className="divide-y divide-ak-border">
                {account.institution && (
                    <DetailRow label="Institution" value={account.institution} />
                )}
                <DetailRow label="Entity" value={account.entity.name} />
                <DetailRow
                    label="Type"
                    value={accountTypeLabels[account.type]}
                />
                <DetailRow label="Currency" value={account.currency} />
                <DetailRow
                    label="Transactions"
                    value={`${transactionCount}`}
                />
                <DetailRow
                    label="Last Import"
                    value={lastImportDate ?? 'Never'}
                />
                <DetailRow
                    label="Status"
                    value={account.isActive ? 'Active' : 'Inactive'}
                />
            </div>
        </div>
    );
}
