'use client';

import { Loader2 } from 'lucide-react';
import type {
    GLAccount,
    GLAccountType,
    NormalBalance,
} from '@/lib/api/accounting';
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

interface GLAccountSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingAccount: GLAccount | null;
    parentCandidates: GLAccount[];
    formCode: string;
    setFormCode: (v: string) => void;
    formName: string;
    setFormName: (v: string) => void;
    formType: GLAccountType;
    setFormType: (v: GLAccountType) => void;
    formNormalBalance: NormalBalance;
    setFormNormalBalance: (v: NormalBalance) => void;
    formDescription: string;
    setFormDescription: (v: string) => void;
    formParentId: string;
    setFormParentId: (v: string) => void;
    isSubmitting: boolean;
    onSubmit: () => void;
}

export function GLAccountSheet({
    open,
    onOpenChange,
    editingAccount,
    parentCandidates,
    formCode,
    setFormCode,
    formName,
    setFormName,
    formType,
    setFormType,
    formNormalBalance,
    setFormNormalBalance,
    formDescription,
    setFormDescription,
    formParentId,
    setFormParentId,
    isSubmitting,
    onSubmit,
}: GLAccountSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md bg-card border-ak-border">
                <SheetHeader>
                    <SheetTitle>
                        {editingAccount ? 'Edit Account' : 'Add Account'}
                    </SheetTitle>
                    <SheetDescription>
                        {editingAccount
                            ? `Editing ${editingAccount.code} — ${editingAccount.name}`
                            : 'Create a new GL account in the chart of accounts.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Account Code
                        </Label>
                        <Input
                            value={formCode}
                            onChange={(e) => setFormCode(e.target.value)}
                            disabled={!!editingAccount}
                            placeholder="1000"
                            className="rounded-lg border-ak-border-2 glass"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Account Name
                        </Label>
                        <Input
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Cash"
                            className="rounded-lg border-ak-border-2 glass"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Account Type
                        </Label>
                        <Select
                            value={formType}
                            onValueChange={(v) => setFormType(v as GLAccountType)}
                            disabled={!!editingAccount}
                        >
                            <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ASSET">Asset</SelectItem>
                                <SelectItem value="LIABILITY">Liability</SelectItem>
                                <SelectItem value="EQUITY">Equity</SelectItem>
                                <SelectItem value="REVENUE">Revenue</SelectItem>
                                <SelectItem value="EXPENSE">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Normal Balance
                        </Label>
                        <Select
                            value={formNormalBalance}
                            onValueChange={(v) => setFormNormalBalance(v as NormalBalance)}
                            disabled={!!editingAccount}
                        >
                            <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DEBIT">Debit</SelectItem>
                                <SelectItem value="CREDIT">Credit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!editingAccount && (
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                Parent Account (optional)
                            </Label>
                            <Select value={formParentId} onValueChange={setFormParentId}>
                                <SelectTrigger className="rounded-lg border-ak-border-2 glass">
                                    <SelectValue placeholder="None (top-level)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None (top-level)</SelectItem>
                                    {parentCandidates.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.code} — {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                            Description (optional)
                        </Label>
                        <Input
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Account description"
                            className="rounded-lg border-ak-border-2 glass"
                        />
                    </div>

                    <Button
                        className="w-full rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium mt-4"
                        onClick={onSubmit}
                        disabled={isSubmitting || !formCode || !formName}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {editingAccount ? 'Save Changes' : 'Create Account'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
