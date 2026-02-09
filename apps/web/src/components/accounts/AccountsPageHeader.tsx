'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { AccountType } from '@/lib/api/accounts';
import type { Entity } from '@/lib/api/entities';
import { AccountFormSheet } from './AccountFormSheet';

const ACCOUNT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'BANK', label: 'Bank' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'INVESTMENT', label: 'Investment' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'OTHER', label: 'Other' },
];

interface AccountsPageHeaderProps {
    entities: Entity[];
}

export function AccountsPageHeader({ entities }: AccountsPageHeaderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [createOpen, setCreateOpen] = useState(false);

    const currentType = searchParams.get('type') || 'all';

    const handleTypeChange = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === 'all') {
                params.delete('type');
            } else {
                params.set('type', value);
            }
            const qs = params.toString();
            router.push(qs ? `?${qs}` : '/money-movement/accounts', { scroll: false });
        },
        [router, searchParams]
    );

    return (
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight font-heading">Accounts</h2>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="type-filter"
                        className="text-sm font-medium text-muted-foreground"
                    >
                        Type:
                    </label>
                    <Select value={currentType} onValueChange={handleTypeChange}>
                        <SelectTrigger id="type-filter" className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Account
                </Button>
            </div>

            <AccountFormSheet
                key="create"
                open={createOpen}
                onOpenChange={setCreateOpen}
                entities={entities}
            />
        </div>
    );
}
