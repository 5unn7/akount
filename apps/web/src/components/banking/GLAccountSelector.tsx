'use client';

import { useState, useEffect } from 'react';
import type { GLAccount } from '@/lib/api/accounting';
import { apiFetch } from '@/lib/api/client-browser';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface GLAccountSelectorProps {
    entityId: string;
    value?: string | null;
    onChange: (glAccountId: string | null) => void;
    disabled?: boolean;
}

export function GLAccountSelector({
    entityId,
    value,
    onChange,
    disabled = false,
}: GLAccountSelectorProps) {
    const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<GLAccount[]>(`/api/accounting/chart-of-accounts?entityId=${entityId}&isActive=true`)
            .then((accounts) => {
                setGlAccounts(accounts);
                setLoading(false);
            })
            .catch(() => {
                setGlAccounts([]);
                setLoading(false);
            });
    }, [entityId]);

    if (loading) {
        return (
            <div className="h-9 bg-muted/30 animate-pulse rounded-md" />
        );
    }

    return (
        <Select
            value={value ?? 'none'}
            onValueChange={(val) => onChange(val === 'none' ? null : val)}
            disabled={disabled}
        >
            <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Select GL account" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none" className="text-xs">
                    <span className="text-muted-foreground">None</span>
                </SelectItem>
                {glAccounts.map((gl) => (
                    <SelectItem key={gl.id} value={gl.id} className="text-xs font-mono">
                        {gl.code} - {gl.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
