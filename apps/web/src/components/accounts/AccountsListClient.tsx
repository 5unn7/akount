'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@/lib/api/accounts';
import type { Entity } from '@/lib/api/entities';
import { AccountRow } from './AccountRow';
import { AccountFormSheet } from './AccountFormSheet';

interface AccountsListClientProps {
    accounts: Account[];
    hasMore: boolean;
    entities: Entity[];
}

export function AccountsListClient({
    accounts,
    hasMore,
    entities,
}: AccountsListClientProps) {
    const router = useRouter();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

    function handleRowClick(account: Account) {
        router.push(`/banking/accounts/${account.id}`);
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {accounts.map((account) => (
                    <AccountRow
                        key={account.id}
                        account={account}
                        onClick={() => handleRowClick(account)}
                    />
                ))}
            </div>

            {hasMore && (
                <p className="text-center text-sm text-muted-foreground">
                    Showing first {accounts.length} accounts. More available.
                </p>
            )}

            <AccountFormSheet
                key={selectedAccount?.id ?? 'edit'}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                account={selectedAccount}
                entities={entities}
            />
        </div>
    );
}
