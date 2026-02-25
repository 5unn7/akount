'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api/client-browser';
import { formatCurrency } from '@/lib/utils/currency';
import { Loader2, Check } from 'lucide-react';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
  /** Pre-fill defaults (e.g. from invoice detail page) */
  defaults?: {
    direction?: PaymentDirection;
    clientId?: string;
    vendorId?: string;
    amount?: number; // Integer cents
    currency?: string;
  };
}

type PaymentDirection = 'AR' | 'AP';

interface OpenDocument {
  id: string;
  number: string;
  total: number;
  paidAmount: number;
  status: string;
}

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

const OPEN_INVOICE_STATUSES = ['SENT', 'OVERDUE', 'PARTIALLY_PAID'];
const OPEN_BILL_STATUSES = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'];

export function PaymentForm({ open, onOpenChange, clients, vendors, onSuccess, defaults }: PaymentFormProps) {
  const defaultDirection = defaults?.direction ?? 'AR';
  const defaultSelectedId = (defaultDirection === 'AR' ? defaults?.clientId : defaults?.vendorId) ?? '';
  const defaultAmountStr = defaults?.amount ? (defaults.amount / 100).toFixed(2) : '';
  const defaultCurrency = defaults?.currency ?? 'CAD';

  const [direction, setDirection] = useState<PaymentDirection>(defaultDirection);
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState(defaultAmountStr);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Allocation state
  const [openDocuments, setOpenDocuments] = useState<OpenDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  // Fetch open documents when client/vendor changes
  useEffect(() => {
    if (!selectedId) {
      setOpenDocuments([]);
      setAllocations({});
      return;
    }

    setLoadingDocs(true);
    const endpoint = direction === 'AR'
      ? `/api/business/invoices?clientId=${selectedId}&limit=100`
      : `/api/business/bills?vendorId=${selectedId}&limit=100`;

    apiFetch<{ invoices?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> }>(endpoint)
      .then(result => {
        // Invoice list returns { invoices: [...] }, bill list returns { data: [...] }
        const items = (result.invoices ?? result.data ?? []) as Array<{
          id: string;
          invoiceNumber?: string;
          billNumber?: string;
          total: number;
          paidAmount: number;
          status: string;
        }>;

        const validStatuses = direction === 'AR' ? OPEN_INVOICE_STATUSES : OPEN_BILL_STATUSES;
        const openDocs = items
          .filter(item =>
            validStatuses.includes(item.status) && item.total > (item.paidAmount ?? 0)
          )
          .map(item => ({
            id: item.id,
            number: (direction === 'AR' ? item.invoiceNumber : item.billNumber) ?? '—',
            total: item.total,
            paidAmount: item.paidAmount ?? 0,
            status: item.status,
          }));

        setOpenDocuments(openDocs);
        setAllocations({});
      })
      .catch(() => {
        setOpenDocuments([]);
      })
      .finally(() => setLoadingDocs(false));
  }, [selectedId, direction]);

  const paymentAmountCents = parseCentsInput(amountStr);
  const totalAllocated = Object.values(allocations).reduce(
    (sum, val) => sum + parseCentsInput(val),
    0
  );
  const unallocated = paymentAmountCents - totalAllocated;
  const isOverAllocated = totalAllocated > paymentAmountCents && paymentAmountCents > 0;

  const setAllocationAmount = (docId: string, value: string) => {
    setAllocations(prev => ({ ...prev, [docId]: value }));
  };

  const fillFull = (doc: OpenDocument) => {
    const outstanding = doc.total - doc.paidAmount;
    setAllocations(prev => ({ ...prev, [doc.id]: (outstanding / 100).toFixed(2) }));
  };

  const resetForm = () => {
    setDirection(defaultDirection);
    setSelectedId(defaultSelectedId);
    setDate(new Date().toISOString().split('T')[0]);
    setAmountStr(defaultAmountStr);
    setCurrency(defaultCurrency);
    setPaymentMethod('TRANSFER');
    setReference('');
    setNotes('');
    setError('');
    setOpenDocuments([]);
    setAllocations({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountCents = parseCentsInput(amountStr);
    if (!selectedId) { setError(`Please select a ${direction === 'AR' ? 'client' : 'vendor'}`); return; }
    if (amountCents <= 0) { setError('Amount must be greater than zero'); return; }
    if (!date) { setError('Date is required'); return; }

    // Validate allocations
    if (isOverAllocated) { setError('Total allocations exceed payment amount'); return; }

    // Validate each allocation doesn't exceed document outstanding
    for (const doc of openDocuments) {
      const allocCents = parseCentsInput(allocations[doc.id] ?? '0');
      const outstanding = doc.total - doc.paidAmount;
      if (allocCents > outstanding) {
        setError(`Allocation for ${doc.number} exceeds outstanding balance of ${formatCurrency(outstanding, currency)}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Phase 1: Create payment
      const payment = await apiFetch<{ id: string }>('/api/business/payments', {
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

      // Phase 2: Allocate each line (sequential to avoid race conditions)
      const allocationEntries = Object.entries(allocations)
        .map(([docId, amtStr]) => ({ docId, amount: parseCentsInput(amtStr) }))
        .filter(a => a.amount > 0);

      for (const alloc of allocationEntries) {
        await apiFetch(`/api/business/payments/${payment.id}/allocate`, {
          method: 'POST',
          body: JSON.stringify({
            [direction === 'AR' ? 'invoiceId' : 'billId']: alloc.docId,
            amount: alloc.amount,
          }),
        });
      }

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
      <SheetContent className="sm:max-w-xl overflow-y-auto">
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

          {/* Allocation Section */}
          {selectedId && (
            <div className="space-y-3">
              <Label className="text-sm uppercase tracking-wider text-muted-foreground">
                Allocate Payment
              </Label>

              {loadingDocs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading open {direction === 'AR' ? 'invoices' : 'bills'}...
                </div>
              ) : openDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No outstanding {direction === 'AR' ? 'invoices' : 'bills'} for this {direction === 'AR' ? 'client' : 'vendor'}
                </p>
              ) : (
                <div className="glass-2 rounded-lg overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_auto_80px_auto] gap-2 px-3 py-2 border-b border-ak-border text-micro uppercase tracking-wider text-muted-foreground">
                    <span>Document</span>
                    <span className="text-right w-20">Total</span>
                    <span className="text-right w-24">Outstanding</span>
                    <span className="text-right">Allocate</span>
                    <span className="w-12" />
                  </div>

                  {/* Document rows */}
                  {openDocuments.map(doc => {
                    const outstanding = doc.total - doc.paidAmount;
                    const allocCents = parseCentsInput(allocations[doc.id] ?? '0');
                    const isOverDoc = allocCents > outstanding;

                    return (
                      <div
                        key={doc.id}
                        className="grid grid-cols-[1fr_auto_auto_80px_auto] gap-2 px-3 py-2 items-center border-b border-ak-border last:border-0"
                      >
                        <span className="text-sm font-medium truncate">{doc.number}</span>
                        <span className="text-sm font-mono text-muted-foreground text-right w-20">
                          {formatCurrency(doc.total, currency)}
                        </span>
                        <span className="text-sm font-mono text-right w-24">
                          {formatCurrency(outstanding, currency)}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={allocations[doc.id] ?? ''}
                          onChange={e => setAllocationAmount(doc.id, e.target.value)}
                          placeholder="0.00"
                          className={`h-7 text-sm font-mono text-right ${isOverDoc ? 'border-destructive' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-12 text-xs text-ak-green hover:text-ak-green px-1"
                          onClick={() => fillFull(doc)}
                        >
                          <Check className="h-3 w-3 mr-0.5" />
                          Full
                        </Button>
                      </div>
                    );
                  })}

                  {/* Running totals */}
                  {paymentAmountCents > 0 && (
                    <div className="px-3 py-2 space-y-1 border-t border-ak-border-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Allocated</span>
                        <span className="font-mono">{formatCurrency(totalAllocated, currency)}</span>
                      </div>
                      {unallocated > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-primary">Unallocated</span>
                          <span className="font-mono text-primary">{formatCurrency(unallocated, currency)}</span>
                        </div>
                      )}
                      {isOverAllocated && (
                        <div className="flex justify-between text-sm">
                          <span className="text-destructive">Over-allocated</span>
                          <span className="font-mono text-destructive">
                            {formatCurrency(totalAllocated - paymentAmountCents, currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || isOverAllocated}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
