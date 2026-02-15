'use client';

import { useState } from 'react';
import type { Account } from '@/lib/api/accounts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface TransactionsFiltersProps {
    accounts: Account[];
    selectedAccountId?: string;
    startDate?: string;
    endDate?: string;
    onFilterChange: (filters: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }) => void;
    onClearFilters: () => void;
}

export function TransactionsFilters({
    accounts,
    selectedAccountId,
    startDate,
    endDate,
    onFilterChange,
    onClearFilters,
}: TransactionsFiltersProps) {
    const [localAccountId, setLocalAccountId] = useState(selectedAccountId || '');
    const [localStartDate, setLocalStartDate] = useState(startDate || '');
    const [localEndDate, setLocalEndDate] = useState(endDate || '');

    const hasFilters = selectedAccountId || startDate || endDate;

    function handleApplyFilters() {
        onFilterChange({
            accountId: localAccountId || undefined,
            startDate: localStartDate || undefined,
            endDate: localEndDate || undefined,
        });
    }

    function handleClear() {
        setLocalAccountId('');
        setLocalStartDate('');
        setLocalEndDate('');
        onClearFilters();
    }

    return (
        <Card className="glass rounded-[14px]">
            <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        Filters
                    </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label htmlFor="account-filter" className="text-xs text-muted-foreground">
                            Account
                        </Label>
                        <Select
                            value={localAccountId}
                            onValueChange={setLocalAccountId}
                        >
                            <SelectTrigger
                                id="account-filter"
                                className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                            >
                                <SelectValue placeholder="All accounts" />
                            </SelectTrigger>
                            <SelectContent className="glass-2 rounded-lg border-ak-border-2">
                                <SelectItem value="all">All accounts</SelectItem>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} ({account.currency})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                            Start Date
                        </Label>
                        <Input
                            id="start-date"
                            type="date"
                            value={localStartDate}
                            onChange={(e) => setLocalStartDate(e.target.value)}
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                            End Date
                        </Label>
                        <Input
                            id="end-date"
                            type="date"
                            value={localEndDate}
                            onChange={(e) => setLocalEndDate(e.target.value)}
                            className="glass-2 rounded-lg border-ak-border focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <Button
                            onClick={handleApplyFilters}
                            className="flex-1 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                        >
                            Apply
                        </Button>
                        {hasFilters && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleClear}
                                title="Clear filters"
                                className="rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
