'use client';

import { useState } from 'react';
import type { Account } from '@/lib/api/accounts';
import { updateAccount } from '@/lib/api/accounts';
import { accountTypeLabels } from '@/lib/utils/account-helpers';
import { GLAccountSelector } from './GLAccountSelector';
import { Button } from '@/components/ui/button';
import { Check, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
    const router = useRouter();
    const [isEditingGL, setIsEditingGL] = useState(false);
    const [glAccountId, setGlAccountId] = useState<string | null>(account.glAccountId ?? null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateAccount(account.id, { glAccountId });
            setIsEditingGL(false);
            router.refresh(); // Refresh to show updated data
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update GL account');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setGlAccountId(account.glAccountId ?? null);
        setIsEditingGL(false);
    };

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

                {/* GL Account Linking */}
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
                        GL Account
                    </span>
                    {!isEditingGL ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono">
                                {account.glAccount ? `${account.glAccount.code} - ${account.glAccount.name}` : 'Not linked'}
                            </span>
                            <button
                                onClick={() => setIsEditingGL(true)}
                                className="p-1 hover:bg-ak-bg-3 rounded transition-colors"
                                aria-label="Edit GL account"
                            >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-48">
                                <GLAccountSelector
                                    entityId={account.entity.id}
                                    value={glAccountId}
                                    onChange={setGlAccountId}
                                    disabled={saving}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <Check className="h-3.5 w-3.5 text-ak-green" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                ×
                            </Button>
                        </div>
                    )}
                </div>

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
