import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders with data-testid="badge"', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  // Variant tests
  it('renders with default variant classes', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-ak-bg-3');
    expect(badge).toHaveClass('text-muted-foreground');
  });

  it.each([
    ['reconciled', 'bg-ak-green/10'],
    ['ai', 'bg-ak-purple/10'],
    ['review', 'bg-primary/10'],
    ['locked', 'bg-ak-bg-3'],
    ['error', 'bg-ak-red/10'],
    ['success', 'bg-ak-green/10'],
    ['warning', 'bg-primary/10'],
    ['info', 'bg-ak-blue/10'],
  ] as const)('renders %s variant with %s class', (variant, expectedClass) => {
    render(<Badge variant={variant}>Test</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(expectedClass);
  });

  // Default icon tests
  it.each([
    ['reconciled', '✓'],
    ['ai', '✨'],
    ['review', '⚠'],
    ['locked', '🔒'],
    ['error', '✕'],
    ['success', '✓'],
    ['warning', '⚠'],
    ['info', 'ℹ'],
  ] as const)(
    'shows default icon "%s" for %s variant',
    (variant, expectedIcon) => {
      render(<Badge variant={variant}>Test</Badge>);
      const badge = screen.getByTestId('badge');
      expect(badge.textContent).toContain(expectedIcon);
    }
  );

  it('does not show default icon for default variant', () => {
    render(<Badge variant="default">Test</Badge>);
    const badge = screen.getByTestId('badge');
    // default variant has no icon in variantIcons, so only children text
    expect(badge.textContent).toBe('Test');
  });

  // Custom icon
  it('renders custom icon overriding default icon', () => {
    render(
      <Badge variant="reconciled" icon={<span data-testid="custom-icon">★</span>}>
        Custom
      </Badge>
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    // Should show custom icon, not the default checkmark
    const badge = screen.getByTestId('badge');
    const iconSpan = badge.querySelector('[aria-hidden="true"]');
    expect(iconSpan).toContainElement(screen.getByTestId('custom-icon'));
  });

  // Size tests
  it('renders md size by default', () => {
    render(<Badge>Medium</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-sm');
    expect(badge).toHaveClass('px-2');
  });

  it('renders sm size', () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('px-1.5');
  });

  // className prop
  it('passes className prop', () => {
    render(<Badge className="custom-class">Styled</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
  });
});
