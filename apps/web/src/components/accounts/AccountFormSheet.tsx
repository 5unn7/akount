'use client';

import { useTransition, useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Account, AccountType } from '@/lib/api/accounts';
import type { Entity } from '@/lib/api/entities';
import {
    createAccountAction,
    updateAccountAction,
    deleteAccountAction,
} from '@/app/(dashboard)/banking/accounts/actions';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
    { value: 'BANK', label: 'Bank Account' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'INVESTMENT', label: 'Investment' },
    { value: 'LOAN', label: 'Loan' },
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'OTHER', label: 'Other' },
];

interface AccountFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: Account;
    entities: Entity[];
}

export function AccountFormSheet({
    open,
    onOpenChange,
    account,
    entities,
}: AccountFormSheetProps) {
    const isEdit = !!account;
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState(account?.name ?? '');
    const [type, setType] = useState<AccountType>(account?.type ?? 'BANK');
    const [entityId, setEntityId] = useState(account?.entity.id ?? entities[0]?.id ?? '');
    const [institution, setInstitution] = useState(account?.institution ?? '');
    const [currency, setCurrency] = useState(account?.currency ?? 'CAD');
    const [country, setCountry] = useState(account?.country ?? 'CA');

    // Reset form state when account prop changes (opening different account)
    useEffect(() => {
        setName(account?.name ?? '');
        setType(account?.type ?? 'BANK');
        setEntityId(account?.entity.id ?? entities[0]?.id ?? '');
        setInstitution(account?.institution ?? '');
        setCurrency(account?.currency ?? 'CAD');
        setCountry(account?.country ?? 'CA');
        setError(null);
    }, [account, entities]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = isEdit
                ? await updateAccountAction(account.id, {
                    name,
                    type,
                    institution: institution || null,
                })
                : await createAccountAction({
                    entityId,
                    name,
                    type,
                    currency,
                    country,
                    institution: institution || undefined,
                });

            if (!result.success) {
                setError(result.error);
                return;
            }
            onOpenChange(false);
        });
    }

    function handleDelete() {
        if (!account) return;
        setError(null);
        startTransition(async () => {
            const result = await deleteAccountAction(account.id);
            if (!result.success) {
                setError(result.error);
                return;
            }
            onOpenChange(false);
        });
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="font-heading font-normal">{isEdit ? 'Edit Account' : 'Add Account'}</SheetTitle>
                    <SheetDescription>
                        {isEdit
                            ? 'Update account details below.'
                            : 'Fill in the details to create a new account.'}
                    </SheetDescription>
                </SheetHeader>

                {error && (
                    <p className="text-sm text-destructive mt-2">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="account-name">Name</Label>
                        <Input
                            id="account-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Main Checking"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account-type">Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                            <SelectTrigger id="account-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ACCOUNT_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!isEdit && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="account-entity">Entity</Label>
                                <Select value={entityId} onValueChange={setEntityId}>
                                    <SelectTrigger id="account-entity">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {entities.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>
                                                {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="account-currency">Currency</Label>
                                    <Input
                                        id="account-currency"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                        maxLength={3}
                                        placeholder="CAD"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account-country">Country</Label>
                                    <Input
                                        id="account-country"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value.toUpperCase())}
                                        maxLength={3}
                                        placeholder="CA"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="account-institution">Institution (optional)</Label>
                        <Input
                            id="account-institution"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="e.g. TD Bank"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                        <Button type="submit" disabled={isPending || !name}>
                            {isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                        </Button>

                        {isEdit && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        disabled={isPending}
                                    >
                                        Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will deactivate &ldquo;{account.name}&rdquo;. The
                                            account and its history will be preserved but hidden.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
