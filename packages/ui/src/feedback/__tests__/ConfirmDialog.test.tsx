import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from '../ConfirmDialog';

// Default props to reduce repetition in tests
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
};

describe('ConfirmDialog', () => {
  it('renders title and description when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows custom confirmLabel and cancelLabel', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Go Back"
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('shows loading state on confirm button', () => {
    render(<ConfirmDialog {...defaultProps} loading />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    // The spinner should be visible
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('does not call onConfirm when loading', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} loading />);
    // The confirm button shows "Processing..." when loading
    await user.click(screen.getByText('Processing...'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows danger variant icon for danger variant', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    // The icon container has bg-red-100 for danger variant
    const iconContainer = document.querySelector('.bg-red-100');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    expect(iconContainer?.textContent).toContain('\u26A0'); // ⚠
  });

  it('shows default variant icon for default variant', () => {
    render(<ConfirmDialog {...defaultProps} variant="default" />);
    // The icon container has bg-blue-100 for default variant
    const iconContainer = document.querySelector('.bg-blue-100');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    expect(iconContainer?.textContent).toContain('\u2139'); // ℹ
  });

  it('accepts custom icon', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        icon={<span data-testid="custom-icon">🗑</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
