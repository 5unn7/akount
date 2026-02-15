'use client';

import {
  type ReactNode,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { cn } from '../utils';

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Column header label */
  header: ReactNode;
  /** Cell renderer */
  cell: (row: T, index: number) => ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Align content */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sortable */
  sortable?: boolean;
  /** Whether column should use monospace font (for numbers) */
  mono?: boolean;
  /** Whether column should be sticky */
  sticky?: 'left' | 'right';
}

export interface DataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Unique key extractor for rows */
  getRowKey: (row: T, index: number) => string;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Current sort column */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Sort change handler */
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  /** Show loading state */
  loading?: boolean;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Additional classes for container */
  className?: string;
  /** Additional classes for table */
  tableClassName?: string;
}

/**
 * Data table component with sorting, selection, and sticky columns.
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={transactions}
 *   columns={[
 *     { key: 'date', header: 'Date', cell: (row) => row.date },
 *     { key: 'description', header: 'Description', cell: (row) => row.description },
 *     { key: 'amount', header: 'Amount', cell: (row) => <MoneyAmount amount={row.amount} />, align: 'right', mono: true },
 *   ]}
 *   getRowKey={(row) => row.id}
 *   selectable
 *   onRowClick={(row) => openDetail(row.id)}
 * />
 * ```
 */
export function DataTable<T>({
  data,
  columns,
  getRowKey,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  sortBy,
  sortDirection = 'asc',
  onSortChange,
  loading = false,
  emptyState,
  className,
  tableClassName,
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const allSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.every((row, i) => selectedKeys.has(getRowKey(row, i)));
  }, [data, selectedKeys, getRowKey]);

  const someSelected = useMemo(() => {
    return data.some((row, i) => selectedKeys.has(getRowKey(row, i)));
  }, [data, selectedKeys, getRowKey]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const newKeys = new Set(data.map((row, i) => getRowKey(row, i)));
      onSelectionChange(newKeys);
    }
  }, [allSelected, data, getRowKey, onSelectionChange]);

  const handleSelectRow = useCallback(
    (key: string) => {
      if (!onSelectionChange) return;

      const newKeys = new Set(selectedKeys);
      if (newKeys.has(key)) {
        newKeys.delete(key);
      } else {
        newKeys.add(key);
      }
      onSelectionChange(newKeys);
    },
    [selectedKeys, onSelectionChange]
  );

  const handleSort = useCallback(
    (key: string) => {
      if (!onSortChange) return;

      const newDirection =
        sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(key, newDirection);
    },
    [sortBy, sortDirection, onSortChange]
  );

  if (data.length === 0 && !loading) {
    return (
      <div className={className}>
        {emptyState || (
          <div className="py-12 text-center text-slate-500">No data</div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-auto', className)}>
      <table className={cn('w-full border-collapse', tableClassName)}>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {selectable && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={handleSelectAll}
                  className={cn(
                    'h-4 w-4 rounded border-slate-300',
                    'text-orange-500 focus:ring-orange-500/50'
                  )}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.sortable && 'cursor-pointer select-none hover:text-slate-700',
                  column.sticky === 'left' && 'sticky left-0 bg-slate-50/95 backdrop-blur-sm z-10',
                  column.sticky === 'right' && 'sticky right-0 bg-slate-50/95 backdrop-blur-sm z-10'
                )}
                style={{ width: column.width }}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortable && sortBy === column.key && (
                    <span aria-hidden="true">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => {
            const rowKey = getRowKey(row, rowIndex);
            const isSelected = selectedKeys.has(rowKey);
            const isHovered = hoveredRow === rowKey;

            return (
              <tr
                key={rowKey}
                onClick={() => onRowClick?.(row, rowIndex)}
                onMouseEnter={() => setHoveredRow(rowKey)}
                onMouseLeave={() => setHoveredRow(null)}
                className={cn(
                  'transition-colors duration-75',
                  onRowClick && 'cursor-pointer',
                  isSelected && 'bg-orange-50',
                  !isSelected && isHovered && 'bg-slate-50'
                )}
              >
                {selectable && (
                  <td className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectRow(rowKey);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        'h-4 w-4 rounded border-slate-300',
                        'text-orange-500 focus:ring-orange-500/50'
                      )}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-3 text-sm',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.mono && 'font-mono tabular-nums',
                      column.sticky === 'left' && 'sticky left-0 bg-white/95 backdrop-blur-sm z-10',
                      column.sticky === 'right' && 'sticky right-0 bg-white/95 backdrop-blur-sm z-10',
                      isSelected && column.sticky && 'bg-orange-50/95'
                    )}
                  >
                    {column.cell(row, rowIndex)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
