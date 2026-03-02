import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock @akount/db to satisfy the type imports at runtime
// The components import `type InvoiceStatus` and `type BillStatus` which are
// type-only at the TS level, but the Record<InvoiceStatus, ...> config objects
// need the enum values to exist as string keys at runtime.
vi.mock('@akount/db', () => ({}));

import { InvoiceStatusBadge } from '../InvoiceStatusBadge';
import { BillStatusBadge } from '../BillStatusBadge';

describe('InvoiceStatusBadge', () => {
  it.each([
    ['DRAFT', 'Draft'],
    ['SENT', 'Sent'],
    ['PAID', 'Paid'],
    ['PARTIALLY_PAID', 'Partial'],
    ['OVERDUE', 'Overdue'],
    ['CANCELLED', 'Cancelled'],
    ['VOIDED', 'Voided'],
  ] as const)('renders %s status with label "%s"', (status, expectedLabel) => {
    // Cast as any since we're passing string literals for the enum type
    render(<InvoiceStatusBadge status={status as never} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('renders DRAFT badge with correct variant (default)', () => {
    render(<InvoiceStatusBadge status={'DRAFT' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-bg-3');
  });

  it('renders PAID badge with success variant', () => {
    render(<InvoiceStatusBadge status={'PAID' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-green/10');
  });

  it('renders OVERDUE badge with error variant', () => {
    render(<InvoiceStatusBadge status={'OVERDUE' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-red/10');
  });

  it('renders SENT badge with info variant', () => {
    render(<InvoiceStatusBadge status={'SENT' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-blue/10');
  });

  it('renders PARTIALLY_PAID badge with warning variant', () => {
    render(<InvoiceStatusBadge status={'PARTIALLY_PAID' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-primary/10');
  });

  it('falls back to DRAFT config for unknown status', () => {
    render(<InvoiceStatusBadge status={'UNKNOWN_STATUS' as never} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders with sm size and custom styling', () => {
    render(<InvoiceStatusBadge status={'PAID' as never} />);
    const badge = screen.getByTestId('badge');
    // The component passes size="sm" to Badge
    expect(badge).toHaveClass('text-xs');
  });
});

describe('BillStatusBadge', () => {
  it.each([
    ['DRAFT', 'Draft'],
    ['PENDING', 'Pending'],
    ['PAID', 'Paid'],
    ['PARTIALLY_PAID', 'Partial'],
    ['OVERDUE', 'Overdue'],
    ['CANCELLED', 'Cancelled'],
  ] as const)('renders %s status with label "%s"', (status, expectedLabel) => {
    render(<BillStatusBadge status={status as never} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('renders DRAFT badge with correct variant (default)', () => {
    render(<BillStatusBadge status={'DRAFT' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-bg-3');
  });

  it('renders PAID badge with success variant', () => {
    render(<BillStatusBadge status={'PAID' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-green/10');
  });

  it('renders OVERDUE badge with error variant', () => {
    render(<BillStatusBadge status={'OVERDUE' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-red/10');
  });

  it('renders PENDING badge with info variant', () => {
    render(<BillStatusBadge status={'PENDING' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-blue/10');
  });

  it('falls back to DRAFT config for unknown status', () => {
    render(<BillStatusBadge status={'UNKNOWN_STATUS' as never} />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders with sm size', () => {
    render(<BillStatusBadge status={'PAID' as never} />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-xs');
  });
});
