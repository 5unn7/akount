'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemBuilder, computeLineTotals, type LineItem, type TaxRateOption } from '@/components/line-item-builder';
import { apiFetch } from '@/lib/api/client-browser';
import { Loader2 } from 'lucide-react';
import type { Invoice } from '@/lib/api/invoices';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string; paymentTerms?: string | null }>;
  onSuccess?: () => void;
  editInvoice?: Invoice;
}

function parseDaysFromTerms(terms: string | null | undefined): number | null {
  if (!terms) return null;
  const match = terms.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

function invoiceLinesToLineItems(invoice: Invoice): LineItem[] {
  if (!invoice.invoiceLines?.length) return [{ description: '', quantity: 1, unitPrice: 0, taxAmount: 0, amount: 0 }];
  return invoice.invoiceLines.map(l => ({
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRateId: l.taxRateId ?? undefined,
    taxAmount: l.taxAmount,
    amount: l.amount,
  }));
}

const INITIAL_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxAmount: 0,
  amount: 0,
};

export function InvoiceForm({ open, onOpenChange, clients, onSuccess, editInvoice }: InvoiceFormProps) {
  const isEdit = !!editInvoice;

  const [clientId, setClientId] = useState(editInvoice?.clientId ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState(editInvoice?.invoiceNumber ?? '');
  const [issueDate, setIssueDate] = useState(
    editInvoice ? toDateInput(editInvoice.issueDate) : new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    editInvoice ? toDateInput(editInvoice.dueDate) : ''
  );
  const [currency, setCurrency] = useState(editInvoice?.currency ?? 'CAD');
  const [notes, setNotes] = useState(editInvoice?.notes ?? '');
  const [lines, setLines] = useState<LineItem[]>(
    editInvoice ? invoiceLinesToLineItems(editInvoice) : [{ ...INITIAL_LINE }]
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [taxRates, setTaxRates] = useState<TaxRateOption[]>([]);

  // Fetch active tax rates when form opens (browser-side)
  useEffect(() => {
    if (!open) return;
    apiFetch<Array<{ id: string; code: string; name: string; rate: number }>>(
      '/api/accounting/tax-rates?isActive=true'
    )
      .then((rates) =>
        setTaxRates(rates.map((r) => ({ id: r.id, code: r.code, name: r.name, rate: r.rate })))
      )
      .catch(() => setTaxRates([])); // Graceful fallback — manual tax entry
  }, [open]);

  const autoFillDueDate = (date: string, cId: string) => {
    const client = clients.find(c => c.id === cId);
    const days = parseDaysFromTerms(client?.paymentTerms);
    if (days && date) {
      setDueDate(addDays(date, days));
    }
  };

  const totals = computeLineTotals(lines);

  const resetForm = () => {
    setClientId('');
    setInvoiceNumber('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setCurrency('CAD');
    setNotes('');
    setLines([{ ...INITIAL_LINE }]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clientId) { setError('Please select a client'); return; }
    if (!invoiceNumber) { setError('Invoice number is required'); return; }
    if (!dueDate) { setError('Due date is required'); return; }
    if (lines.some(l => !l.description)) { setError('All lines need a description'); return; }
    if (totals.total <= 0) { setError('Total must be greater than zero'); return; }

    setSubmitting(true);
    try {
      const payload = {
        clientId,
        invoiceNumber,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        currency,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        ...(isEdit ? {} : { status: 'DRAFT' }),
        notes: notes || undefined,
        lines: lines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRateId: l.taxRateId || undefined,
          taxAmount: l.taxAmount,
          amount: l.amount,
        })),
      };

      if (isEdit) {
        await apiFetch(`/api/business/invoices/${editInvoice.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/business/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!isEdit) resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} invoice`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={clientId}
                onValueChange={(v) => { setClientId(v); autoFillDueDate(issueDate, v); }}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={e => { setIssueDate(e.target.value); autoFillDueDate(e.target.value, clientId); }}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
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
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            <LineItemBuilder
              lines={lines}
              onChange={setLines}
              currency={currency}
              taxRates={taxRates}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
