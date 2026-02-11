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
            <h2 className="text-3xl font-heading font-normal tracking-tight">Accounts</h2>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="type-filter"
                        className="text-xs uppercase tracking-[0.05em] font-medium text-muted-foreground"
                    >
                        Type
                    </label>
                    <Select value={currentType} onValueChange={handleTypeChange}>
                        <SelectTrigger id="type-filter" className="w-[150px] glass-2 rounded-lg border-[rgba(255,255,255,0.06)] focus:ring-primary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-2 rounded-lg border-[rgba(255,255,255,0.09)]">
                            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button onClick={() => setCreateOpen(true)} className="rounded-lg bg-primary hover:bg-[#FBBF24] text-black font-medium">
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
