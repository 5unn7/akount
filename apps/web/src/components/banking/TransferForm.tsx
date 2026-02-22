'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Account } from '@/lib/api/accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Loader2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency';
import { createTransferAction } from '@/app/(dashboard)/banking/transfers/actions';

interface TransferFormProps {
  accounts: Account[];
  entityId: string;
  onSuccess?: () => void;
}

export function TransferForm({ accounts, entityId, onSuccess }: TransferFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amountDollars: '',
    memo: '',
    exchangeRate: '',
  });

  // Filter accounts based on selection
  const fromAccount = accounts.find((a) => a.id === formData.fromAccountId);
  const toAccount = accounts.find((a) => a.id === formData.toAccountId);
  const isMultiCurrency = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  // Calculate amounts
  const amountCents = formData.amountDollars ? Math.round(parseFloat(formData.amountDollars) * 100) : 0;
  const fxRate = formData.exchangeRate ? parseFloat(formData.exchangeRate) : 1;
  const convertedAmount = isMultiCurrency && fxRate ? Math.round(amountCents * fxRate) : amountCents;

  // Validation
  const canSubmit = useMemo(() => {
    if (!formData.fromAccountId || !formData.toAccountId) return false;
    if (formData.fromAccountId === formData.toAccountId) return false;
    if (amountCents <= 0) return false;
    if (isMultiCurrency && !formData.exchangeRate) return false;
    return true;
  }, [formData, amountCents, isMultiCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !fromAccount) return;

    setIsSubmitting(true);

    try {
      const input = {
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: amountCents,
        currency: fromAccount.currency,
        date: new Date().toISOString(),
        memo: formData.memo || undefined,
        exchangeRate: isMultiCurrency && formData.exchangeRate
          ? parseFloat(formData.exchangeRate)
          : undefined,
      };

      const result = await createTransferAction(input);
      toast.success(`Transfer created: ${formatCurrency(amountCents, fromAccount.currency)}`);

      // Reset form
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amountDollars: '',
        memo: '',
        exchangeRate: '',
      });

      router.refresh();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create transfer';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* From Account */}
      <div className="space-y-2">
        <Label htmlFor="fromAccount" className="text-xs uppercase tracking-wider text-muted-foreground">
          From Account
        </Label>
        <Select
          value={formData.fromAccountId}
          onValueChange={(value) => setFormData({ ...formData, fromAccountId: value })}
        >
          <SelectTrigger id="fromAccount" className="rounded-lg border-ak-border-2 glass">
            <SelectValue placeholder="Select source account" />
          </SelectTrigger>
          <SelectContent>
            {accounts
              .filter((a) => a.id !== formData.toAccountId)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{account.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatCurrency(account.currentBalance, account.currency)}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* To Account */}
      <div className="space-y-2">
        <Label htmlFor="toAccount" className="text-xs uppercase tracking-wider text-muted-foreground">
          To Account
        </Label>
        <Select
          value={formData.toAccountId}
          onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}
        >
          <SelectTrigger id="toAccount" className="rounded-lg border-ak-border-2 glass">
            <SelectValue placeholder="Select destination account" />
          </SelectTrigger>
          <SelectContent>
            {accounts
              .filter((a) => a.id !== formData.fromAccountId)
              .map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{account.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatCurrency(account.currentBalance, account.currency)}
                    </span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-muted-foreground">
          Amount {fromAccount && `(${fromAccount.currency})`}
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {fromAccount?.currency === 'USD' ? '$' : fromAccount?.currency === 'CAD' ? '$' : fromAccount?.currency || '$'}
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amountDollars}
            onChange={(e) => setFormData({ ...formData, amountDollars: e.target.value })}
            placeholder="0.00"
            className="rounded-lg border-ak-border-2 glass pl-8"
          />
        </div>
        {fromAccount && amountCents > fromAccount.currentBalance && !['CREDIT_CARD', 'LOAN', 'MORTGAGE'].includes(fromAccount.type) && (
          <p className="text-xs text-ak-red">
            Insufficient balance (available: {formatCurrency(fromAccount.currentBalance, fromAccount.currency)})
          </p>
        )}
      </div>

      {/* Exchange Rate (multi-currency only) */}
      {isMultiCurrency && (
        <div className="space-y-2">
          <Label htmlFor="exchangeRate" className="text-xs uppercase tracking-wider text-muted-foreground">
            Exchange Rate ({fromAccount?.currency} → {toAccount?.currency})
          </Label>
          <Input
            id="exchangeRate"
            type="number"
            step="0.0001"
            min="0.0001"
            value={formData.exchangeRate}
            onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
            placeholder="e.g., 1.35"
            className="rounded-lg border-ak-border-2 glass"
          />
          {formData.exchangeRate && toAccount && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Preview:</span>
              <span className="font-mono text-foreground">
                {formatCurrency(amountCents, fromAccount?.currency || 'CAD')}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-ak-green">
                {formatCurrency(convertedAmount, toAccount.currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Memo */}
      <div className="space-y-2">
        <Label htmlFor="memo" className="text-xs uppercase tracking-wider text-muted-foreground">
          Memo (optional)
        </Label>
        <Textarea
          id="memo"
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          placeholder="e.g., Monthly savings transfer"
          rows={2}
          className="rounded-lg border-ak-border-2 glass resize-none"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="w-full rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Transfer...
          </>
        ) : (
          <>
            <ArrowRightLeft className="h-4 w-4" />
            Create Transfer
          </>
        )}
      </Button>

      {formData.fromAccountId === formData.toAccountId && formData.fromAccountId && (
        <p className="text-xs text-ak-red text-center">
          Cannot transfer to the same account
        </p>
      )}
    </form>
  );
}
