'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api/client-browser';
import { Loader2 } from 'lucide-react';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

type PaymentDirection = 'AR' | 'AP';

const PAYMENT_METHODS = [
  { value: 'TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECK', label: 'Check' },
  { value: 'WIRE', label: 'Wire' },
  { value: 'OTHER', label: 'Other' },
] as const;

function parseCentsInput(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function PaymentForm({ open, onOpenChange, clients, vendors, onSuccess }: PaymentFormProps) {
  const [direction, setDirection] = useState<PaymentDirection>('AR');
  const [selectedId, setSelectedId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setDirection('AR');
    setSelectedId('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmountStr('');
    setCurrency('CAD');
    setPaymentMethod('TRANSFER');
    setReference('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountCents = parseCentsInput(amountStr);
    if (!selectedId) { setError(`Please select a ${direction === 'AR' ? 'client' : 'vendor'}`); return; }
    if (amountCents <= 0) { setError('Amount must be greater than zero'); return; }
    if (!date) { setError('Date is required'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/api/business/payments', {
        method: 'POST',
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          amount: amountCents,
          currency,
          paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
          ...(direction === 'AR' ? { clientId: selectedId } : { vendorId: selectedId }),
        }),
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const counterparties = direction === 'AR' ? clients : vendors;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Record Payment</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Direction toggle */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={direction === 'AR' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setDirection('AR'); setSelectedId(''); }}
                className="flex-1"
              >
                Customer Payment (AR)
              </Button>
              <Button
                type="button"
                variant={direction === 'AP' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setDirection('AP'); setSelectedId(''); }}
                className="flex-1"
              >
                Vendor Payment (AP)
              </Button>
            </div>
          </div>

          {/* Client/Vendor selection */}
          <div className="space-y-2">
            <Label>{direction === 'AR' ? 'Client' : 'Vendor'}</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${direction === 'AR' ? 'client' : 'vendor'}`} />
              </SelectTrigger>
              <SelectContent>
                {counterparties.map(cp => (
                  <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(pm => (
                    <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Check #, wire ref, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
