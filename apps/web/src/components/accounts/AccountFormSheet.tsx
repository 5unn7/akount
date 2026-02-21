'use client';

import { useTransition, useState, useEffect } from 'react';
import Link from 'next/link';
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
import { CheckCircle2, Upload, Eye, Plus } from 'lucide-react';
import type { Account, AccountType } from '@/lib/api/accounts';
import type { Entity } from '@/lib/api/entities';
import { formatCurrency } from '@/lib/utils/currency';
import { CountrySelect } from '@/components/ui/country-select';
import { getCurrencyForCountry, getCountryByCode } from '@/lib/data/countries';
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
    const [openingBalance, setOpeningBalance] = useState('');
    const [createdAccount, setCreatedAccount] = useState<Account | null>(null);

    const handleCountryChange = (newCountry: string) => {
        setCountry(newCountry);
        setCurrency(getCurrencyForCountry(newCountry));
    };

    const selectedCountry = getCountryByCode(country);
    const currencyLabel = selectedCountry
        ? `${selectedCountry.currency} — ${selectedCountry.currencyName}`
        : currency;

    // Reset form state when account prop changes or sheet reopens
    useEffect(() => {
        setName(account?.name ?? '');
        setType(account?.type ?? 'BANK');
        setEntityId(account?.entity.id ?? entities[0]?.id ?? '');
        setInstitution(account?.institution ?? '');
        setCurrency(account?.currency ?? 'CAD');
        setCountry(account?.country ?? 'CA');
        setOpeningBalance('');
        setCreatedAccount(null);
        setError(null);
    }, [account, entities, open]);

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
                    ...(openingBalance && {
                        openingBalance: Math.round(parseFloat(openingBalance) * 100),
                        openingBalanceDate: new Date().toISOString(),
                    }),
                });

            if (!result.success) {
                setError(result.error);
                return;
            }
            if (!isEdit) {
                setCreatedAccount(result.data);
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

                {createdAccount ? (
                    <div className="flex flex-col items-center text-center mt-8 space-y-4">
                        <CheckCircle2 className="h-12 w-12 text-ak-green" />
                        <h3 className="text-lg font-heading font-normal">Account created!</h3>
                        <p className="text-sm text-muted-foreground">
                            {createdAccount.name}
                        </p>
                        <span className="text-2xl font-mono font-bold">
                            {formatCurrency(createdAccount.currentBalance, createdAccount.currency)}
                        </span>

                        <div className="flex flex-col gap-2 w-full pt-4">
                            <Button asChild className="gap-1.5 bg-primary hover:bg-ak-pri-hover text-black font-medium">
                                <Link href={`/banking/imports?accountId=${createdAccount.id}`}>
                                    <Upload className="h-4 w-4" />
                                    Import Transactions
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="gap-1.5 border-ak-border-2 hover:bg-ak-bg-3">
                                <Link href={`/banking/accounts/${createdAccount.id}`}>
                                    <Eye className="h-4 w-4" />
                                    View Account
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                className="gap-1.5"
                                onClick={() => {
                                    setCreatedAccount(null);
                                    setName('');
                                    setType('BANK');
                                    setInstitution('');
                                    setOpeningBalance('');
                                    setError(null);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                Add Another
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
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

                            <div className="space-y-2">
                                <Label>Country</Label>
                                <CountrySelect
                                    value={country}
                                    onChange={handleCountryChange}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="account-currency">Currency</Label>
                                <input
                                    id="account-currency"
                                    type="text"
                                    value={currencyLabel}
                                    readOnly
                                    disabled
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Auto-set from country. Change country to update.
                                </p>
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

                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="account-opening-balance">Opening Balance (optional)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">$</span>
                                <Input
                                    id="account-opening-balance"
                                    type="number"
                                    step="0.01"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7 font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Current balance of this account. A journal entry will be created automatically.
                            </p>
                        </div>
                    )}

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
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
