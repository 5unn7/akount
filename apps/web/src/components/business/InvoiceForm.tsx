'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemBuilder, computeLineTotals, type LineItem } from '@/components/line-item-builder';
import { apiFetch } from '@/lib/api/client-browser';
import { Loader2 } from 'lucide-react';

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

const INITIAL_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxAmount: 0,
  amount: 0,
};

export function InvoiceForm({ open, onOpenChange, clients, onSuccess }: InvoiceFormProps) {
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...INITIAL_LINE }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      await apiFetch('/api/business/invoices', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          invoiceNumber,
          issueDate: new Date(issueDate).toISOString(),
          dueDate: new Date(dueDate).toISOString(),
          currency,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          status: 'DRAFT',
          notes: notes || undefined,
          lines: lines.map(l => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxAmount: l.taxAmount,
            amount: l.amount,
          })),
        }),
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">New Invoice</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
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
                onChange={e => setIssueDate(e.target.value)}
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
              Create Invoice
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
