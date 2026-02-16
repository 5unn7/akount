'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Line Item Builder — Reusable component for invoice/bill line items.
 *
 * All amounts in integer cents. Display formatted as currency.
 * Glass UI styling with glass card rows and ak-border separators.
 */

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // Integer cents
  taxAmount: number; // Integer cents
  amount: number; // Integer cents (qty * unitPrice)
  glAccountId?: string;
}

interface LineItemBuilderProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  currency?: string;
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseCentsInput(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

const EMPTY_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxAmount: 0,
  amount: 0,
};

export function LineItemBuilder({ lines, onChange, currency = 'USD' }: LineItemBuilderProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const updateLine = useCallback(
    (index: number, field: keyof LineItem, value: string | number) => {
      const updated = [...lines];
      const line = { ...updated[index] };

      if (field === 'description') {
        line.description = value as string;
      } else if (field === 'quantity') {
        line.quantity = Math.max(1, Number(value) || 1);
        line.amount = line.quantity * line.unitPrice;
      } else if (field === 'unitPrice') {
        line.unitPrice = parseCentsInput(value as string);
        line.amount = line.quantity * line.unitPrice;
      } else if (field === 'taxAmount') {
        line.taxAmount = parseCentsInput(value as string);
      }

      updated[index] = line;
      onChange(updated);
    },
    [lines, onChange]
  );

  const addLine = useCallback(() => {
    onChange([...lines, { ...EMPTY_LINE }]);
  }, [lines, onChange]);

  const removeLine = useCallback(
    (index: number) => {
      if (lines.length <= 1) return; // Minimum 1 line
      const updated = lines.filter((_, i) => i !== index);
      onChange(updated);
    },
    [lines, onChange]
  );

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const totalTax = lines.reduce((sum, l) => sum + l.taxAmount, 0);
  const total = subtotal + totalTax;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_120px_120px_120px_40px] gap-2 text-xs text-muted-foreground uppercase tracking-wider px-1">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit Price</span>
        <span className="text-right">Tax</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {/* Line items */}
      {lines.map((line, index) => (
        <div
          key={index}
          className="glass rounded-lg p-3 grid grid-cols-[1fr_80px_120px_120px_120px_40px] gap-2 items-center"
        >
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(index, 'description', e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => updateLine(index, 'quantity', e.target.value)}
            className="h-8 text-sm text-right font-mono"
          />
          <Input
            type="number"
            step="0.01"
            min={0}
            value={focusedField === `unitPrice-${index}` ? undefined : formatCents(line.unitPrice)}
            defaultValue={formatCents(line.unitPrice)}
            onFocus={() => setFocusedField(`unitPrice-${index}`)}
            onBlur={(e) => {
              setFocusedField(null);
              updateLine(index, 'unitPrice', e.target.value);
            }}
            className="h-8 text-sm text-right font-mono"
          />
          <Input
            type="number"
            step="0.01"
            min={0}
            value={focusedField === `tax-${index}` ? undefined : formatCents(line.taxAmount)}
            defaultValue={formatCents(line.taxAmount)}
            onFocus={() => setFocusedField(`tax-${index}`)}
            onBlur={(e) => {
              setFocusedField(null);
              updateLine(index, 'taxAmount', e.target.value);
            }}
            className="h-8 text-sm text-right font-mono"
          />
          <div className="text-sm text-right font-mono text-foreground">
            {formatCents(line.amount)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeLine(index)}
            disabled={lines.length <= 1}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}

      {/* Add line button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addLine}
        className="text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add line
      </Button>

      {/* Totals */}
      <div className="border-t border-ak-border pt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-mono">{currency} {formatCents(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span className="font-mono">{currency} {formatCents(totalTax)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="font-mono">{currency} {formatCents(total)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compute totals from lines for form submission (integer cents).
 */
export function computeLineTotals(lines: LineItem[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const taxAmount = lines.reduce((sum, l) => sum + l.taxAmount, 0);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}
