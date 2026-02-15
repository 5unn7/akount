'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowRight } from 'lucide-react';

/**
 * Column Mapping Editor for CSV imports
 *
 * Lets users map CSV columns to transaction fields.
 * Auto-detects common header patterns, allows manual override.
 */

export interface ColumnMappings {
  date: string;
  description: string;
  amount: string; // Single column OR "debit|credit" for two-column
  balance?: string;
}

interface ColumnMappingEditorProps {
  columns: string[];
  mappings: ColumnMappings;
  onMappingsChange: (mappings: ColumnMappings) => void;
  previewRows?: Record<string, string>[];
}

const NONE_VALUE = '__none__';

/** Auto-detect column mappings from header names.
 *  Uses exact-match-first to avoid false positives
 *  (e.g., "Shipping and Handling Amount" matching 'amount'). */
export function detectMappings(columns: string[]): ColumnMappings {
  const lower = columns.map(c => c.toLowerCase().trim());

  // Exact match first, then substring
  const find = (patterns: string[]) => {
    const exactIdx = lower.findIndex(c => patterns.some(p => c === p));
    if (exactIdx !== -1) return columns[exactIdx];
    const subIdx = lower.findIndex(c => patterns.some(p => c.includes(p)));
    if (subIdx !== -1) return columns[subIdx];
    return '';
  };

  const dateCol = find(['date', 'posted', 'transaction date', 'trans date', 'value date']);
  const descCol = find(['description', 'desc', 'memo', 'narrative', 'details', 'payee', 'name', 'subject', 'item title']);

  // Check for separate debit/credit columns first
  const debitCol = find(['debit', 'withdrawal', 'charge', 'money out']);
  const creditCol = find(['credit', 'deposit', 'money in']);

  let amount = '';
  if (debitCol && creditCol && debitCol !== creditCol) {
    amount = `${debitCol}|${creditCol}`;
  } else {
    // Single amount column — 'gross'/'net' for PayPal, 'amount' for others
    amount = find(['gross', 'net', 'amount', 'total']);
  }

  const balanceCol = find(['balance', 'running balance', 'closing balance']);

  return {
    date: dateCol || columns[0] || '',
    description: descCol || columns[1] || '',
    amount: amount || debitCol || creditCol || columns[2] || '',
    balance: balanceCol || undefined,
  };
}

/** Read CSV headers from a File object (first line only) */
export async function readCsvHeaders(file: File): Promise<{ columns: string[]; previewRows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);

      if (lines.length < 2) {
        reject(new Error('CSV file must have at least a header row and one data row'));
        return;
      }

      // Parse header — handle quoted columns
      const parseRow = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const columns = parseRow(lines[0]);

      // Parse up to 5 preview rows
      const previewRows: Record<string, string>[] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = parseRow(lines[i]);
        const row: Record<string, string> = {};
        columns.forEach((col, idx) => {
          row[col] = values[idx] || '';
        });
        previewRows.push(row);
      }

      resolve({ columns, previewRows });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    // Read only first 64KB for headers + preview (performance)
    reader.readAsText(file.slice(0, 65536));
  });
}

export function ColumnMappingEditor({
  columns,
  mappings,
  onMappingsChange,
  previewRows = [],
}: ColumnMappingEditorProps) {
  // Parse debit/credit from amount field
  const isTwoColumn = mappings.amount.includes('|');
  const [useTwoColumn, setUseTwoColumn] = useState(isTwoColumn);
  const [debitCol, creditCol] = isTwoColumn ? mappings.amount.split('|') : ['', ''];

  const handleFieldChange = (field: keyof ColumnMappings, value: string) => {
    const updated = { ...mappings, [field]: value === NONE_VALUE ? undefined : value };
    onMappingsChange(updated as ColumnMappings);
  };

  const handleTwoColumnToggle = (enabled: boolean) => {
    setUseTwoColumn(enabled);
    if (enabled) {
      // Switch to debit|credit
      const d = columns.find(c => c.toLowerCase().includes('debit')) || columns[0] || '';
      const c = columns.find(c => c.toLowerCase().includes('credit')) || columns[1] || '';
      onMappingsChange({ ...mappings, amount: `${d}|${c}` });
    } else {
      // Switch to single column
      const single = columns.find(c => c.toLowerCase().includes('amount')) || columns[0] || '';
      onMappingsChange({ ...mappings, amount: single });
    }
  };

  const handleDebitCreditChange = (which: 'debit' | 'credit', value: string) => {
    const [d, c] = mappings.amount.split('|');
    const newDebit = which === 'debit' ? value : d;
    const newCredit = which === 'credit' ? value : c;
    onMappingsChange({ ...mappings, amount: `${newDebit}|${newCredit}` });
  };

  const renderColumnSelect = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    required: boolean = true,
  ) => (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-ak-red">*</span>}
      </Label>
      <Select value={value || NONE_VALUE} onValueChange={onChange}>
        <SelectTrigger className="glass-2 rounded-lg border-ak-border focus:ring-primary">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent className="glass-2 rounded-lg border-ak-border-2">
          {!required && (
            <SelectItem value={NONE_VALUE}>
              <span className="text-muted-foreground">None</span>
            </SelectItem>
          )}
          {columns.map(col => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="font-heading font-normal">Map Columns</CardTitle>
        <CardDescription>
          Tell us which columns contain the date, description, and amount.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mapping Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderColumnSelect('Date Column', mappings.date, (v) => handleFieldChange('date', v))}
          {renderColumnSelect('Description Column', mappings.description, (v) => handleFieldChange('description', v))}
        </div>

        {/* Amount Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount Column
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Separate Debit/Credit</span>
              <Switch
                checked={useTwoColumn}
                onCheckedChange={handleTwoColumnToggle}
              />
            </div>
          </div>

          {useTwoColumn ? (
            <div className="grid grid-cols-2 gap-4">
              {renderColumnSelect('Debit Column', debitCol, (v) => handleDebitCreditChange('debit', v))}
              {renderColumnSelect('Credit Column', creditCol, (v) => handleDebitCreditChange('credit', v))}
            </div>
          ) : (
            renderColumnSelect('Amount', mappings.amount, (v) => handleFieldChange('amount', v))
          )}
        </div>

        {/* Balance (optional) */}
        {renderColumnSelect('Balance Column', mappings.balance || '', (v) => handleFieldChange('balance', v), false)}

        {/* Preview */}
        {previewRows.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Mapping Preview
            </p>
            <div className="overflow-x-auto rounded-lg border border-ak-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ak-border bg-ak-bg-3">
                    <th className="py-2 px-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="py-2 px-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      Description
                    </th>
                    <th className="py-2 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                      Amount
                    </th>
                    {mappings.balance && (
                      <th className="py-2 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                        Balance
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 3).map((row, i) => {
                    const amountStr = useTwoColumn
                      ? `D: ${row[debitCol] || '—'} / C: ${row[creditCol] || '—'}`
                      : row[mappings.amount] || '—';
                    return (
                      <tr key={i} className="border-b border-ak-border">
                        <td className="py-2 px-3 font-mono text-xs">
                          {row[mappings.date] || '—'}
                        </td>
                        <td className="py-2 px-3 text-xs max-w-[200px] truncate">
                          {row[mappings.description] || '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-xs">
                          {amountStr}
                        </td>
                        {mappings.balance && (
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {row[mappings.balance] || '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              <span>Showing how your data will be mapped</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
