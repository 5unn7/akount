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

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Array<{ id: string; name: string; paymentTerms?: string | null }>;
  onSuccess?: () => void;
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

const INITIAL_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxAmount: 0,
  amount: 0,
};

export function BillForm({ open, onOpenChange, vendors, onSuccess }: BillFormProps) {
  const [vendorId, setVendorId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([{ ...INITIAL_LINE }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const autoFillDueDate = (date: string, vId: string) => {
    const vendor = vendors.find(v => v.id === vId);
    const days = parseDaysFromTerms(vendor?.paymentTerms);
    if (days && date) {
      setDueDate(addDays(date, days));
    }
  };

  const totals = computeLineTotals(lines);

  const resetForm = () => {
    setVendorId('');
    setBillNumber('');
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

    if (!vendorId) { setError('Please select a vendor'); return; }
    if (!billNumber) { setError('Bill number is required'); return; }
    if (!dueDate) { setError('Due date is required'); return; }
    if (lines.some(l => !l.description)) { setError('All lines need a description'); return; }
    if (totals.total <= 0) { setError('Total must be greater than zero'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/api/business/bills', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          billNumber,
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
      setError(err instanceof Error ? err.message : 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">New Bill</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={(v) => { setVendorId(v); autoFillDueDate(issueDate, v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bill Number</Label>
              <Input
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                placeholder="BILL-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={e => { setIssueDate(e.target.value); autoFillDueDate(e.target.value, vendorId); }}
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

          <div className="space-y-2">
            <Label>Line Items</Label>
            <LineItemBuilder
              lines={lines}
              onChange={setLines}
              currency={currency}
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
              Create Bill
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
