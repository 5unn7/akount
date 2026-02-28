'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { formatCents, parseCentsInput } from '@/lib/utils/currency';
import { formatTaxRate } from '@/lib/utils/tax';

/**
 * Line Item Builder — Reusable component for invoice/bill line items.
 *
 * All amounts in integer cents. Display formatted as currency.
 * Glass UI styling with glass card rows and ak-border separators.
 *
 * UX-102: Tax rate dropdown with auto-calculation.
 * When a tax rate is selected, taxAmount is auto-computed from amount * rate.
 * When no rate is selected, taxAmount can be entered manually (backwards compat).
 */

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // Integer cents
  taxRateId?: string; // Optional link to TaxRate
  taxAmount: number; // Integer cents
  amount: number; // Integer cents (qty * unitPrice)
  glAccountId?: string;
}

export interface TaxRateOption {
  id: string;
  code: string;
  name: string;
  rateBasisPoints: number; // FIN-32: basis points (1300 = 13%, 500 = 5%)
}

interface LineItemBuilderProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  currency?: string;
  taxRates?: TaxRateOption[];
}

// DRY-21: formatCents and parseCentsInput now imported from @/lib/utils/currency

/**
 * Calculate tax amount from line amount and tax rate in basis points
 * @param amount - Line amount in cents
 * @param rateBasisPoints - Tax rate in basis points (1300 = 13%)
 * @returns Tax amount in cents
 */
function calcTaxAmount(amount: number, rateBasisPoints: number): number {
  return Math.round((amount * rateBasisPoints) / 10000);
}

const EMPTY_LINE: LineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRateId: undefined,
  taxAmount: 0,
  amount: 0,
};

const NO_TAX_VALUE = '__none__';

export function LineItemBuilder({
  lines,
  onChange,
  currency = 'USD',
  taxRates = [],
}: LineItemBuilderProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const hasTaxRates = taxRates.length > 0;

  const findRate = useCallback(
    (taxRateId: string | undefined): number | null => {
      if (!taxRateId) return null;
      const found = taxRates.find((r) => r.id === taxRateId);
      return found ? found.rateBasisPoints : null;
    },
    [taxRates]
  );

  const updateLine = useCallback(
    (index: number, field: keyof LineItem, value: string | number | undefined) => {
      const updated = [...lines];
      const line = { ...updated[index] };

      if (field === 'description') {
        line.description = value as string;
      } else if (field === 'quantity') {
        line.quantity = Math.max(1, Number(value) || 1);
        line.amount = line.quantity * line.unitPrice;
        // Recalculate tax if rate is selected
        const rate = findRate(line.taxRateId);
        if (rate !== null) {
          line.taxAmount = calcTaxAmount(line.amount, rate);
        }
      } else if (field === 'unitPrice') {
        line.unitPrice = parseCentsInput(value as string);
        line.amount = line.quantity * line.unitPrice;
        // Recalculate tax if rate is selected
        const rate = findRate(line.taxRateId);
        if (rate !== null) {
          line.taxAmount = calcTaxAmount(line.amount, rate);
        }
      } else if (field === 'taxRateId') {
        const newRateId = value === NO_TAX_VALUE || !value ? undefined : (value as string);
        line.taxRateId = newRateId;
        const rate = findRate(newRateId);
        if (rate !== null) {
          line.taxAmount = calcTaxAmount(line.amount, rate);
        } else {
          line.taxAmount = 0;
        }
      } else if (field === 'taxAmount') {
        // Only allow manual tax entry when no rate is selected
        if (!line.taxRateId) {
          line.taxAmount = parseCentsInput(value as string);
        }
      }

      updated[index] = line;
      onChange(updated);
    },
    [lines, onChange, findRate]
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

  // Grid columns: Description | Qty | Unit Price | [Tax Rate] | Tax | Amount | Delete
  const gridCols = hasTaxRates
    ? 'grid-cols-[1fr_60px_100px_130px_90px_100px_32px]'
    : 'grid-cols-[1fr_80px_120px_120px_120px_40px]';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className={`grid ${gridCols} gap-2 text-xs text-muted-foreground uppercase tracking-wider px-1`}
      >
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit Price</span>
        {hasTaxRates && <span>Tax Rate</span>}
        <span className="text-right">Tax</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {/* Line items */}
      {lines.map((line, index) => (
        <div
          key={index}
          className={`glass rounded-lg p-3 grid ${gridCols} gap-2 items-center`}
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

          {/* Tax Rate dropdown */}
          {hasTaxRates && (
            <Select
              value={line.taxRateId ?? NO_TAX_VALUE}
              onValueChange={(v) => updateLine(index, 'taxRateId', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="No tax" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TAX_VALUE}>No tax</SelectItem>
                {taxRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id}>
                    {rate.code} ({formatTaxRate(rate.rateBasisPoints, rate.rateBasisPoints % 100 === 0 ? 0 : 1)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Tax amount — read-only when rate selected, editable otherwise */}
          {line.taxRateId && hasTaxRates ? (
            <div className="text-sm text-right font-mono text-muted-foreground">
              {formatCents(line.taxAmount)}
            </div>
          ) : (
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
          )}

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
