import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with data-testid="button"', () => {
    render(<Button>Test</Button>);
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  // Variant tests
  it('renders with default variant (primary) classes', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-orange-500');
  });

  it('renders secondary variant with correct classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-violet-100');
    expect(button).toHaveClass('text-violet-700');
  });

  it('renders ghost variant with correct classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border');
  });

  it('renders danger variant with correct classes', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-red-500');
    expect(button).toHaveClass('text-white');
  });

  // Size tests
  it('renders with default size (md) classes', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-4');
  });

  it('renders sm size with correct classes', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('px-3');
  });

  it('renders lg size with correct classes', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('h-12');
    expect(button).toHaveClass('px-5');
  });

  // Loading state tests
  it('shows loading spinner when loading=true', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByTestId('button');
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('sets aria-busy=false when not loading', () => {
    render(<Button>Not Loading</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('disables button when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });

  // Icon tests
  it('shows icon on left by default', () => {
    const icon = <span data-testid="test-icon">+</span>;
    render(<Button icon={icon}>With Icon</Button>);
    const button = screen.getByTestId('button');
    const iconEl = screen.getByTestId('test-icon');
    const textEl = screen.getByText('With Icon');
    // Icon should come before text in the DOM
    const children = Array.from(button.childNodes);
    const iconIdx = children.findIndex((n) =>
      n.contains(iconEl)
    );
    const textIdx = children.findIndex((n) =>
      n.contains(textEl)
    );
    expect(iconIdx).toBeLessThan(textIdx);
  });

  it('shows icon on right when iconPosition="right"', () => {
    const icon = <span data-testid="test-icon">+</span>;
    render(
      <Button icon={icon} iconPosition="right">
        With Icon
      </Button>
    );
    const button = screen.getByTestId('button');
    const iconEl = screen.getByTestId('test-icon');
    const textEl = screen.getByText('With Icon');
    const children = Array.from(button.childNodes);
    const iconIdx = children.findIndex((n) =>
      n.contains(iconEl)
    );
    const textIdx = children.findIndex((n) =>
      n.contains(textEl)
    );
    expect(iconIdx).toBeGreaterThan(textIdx);
  });

  it('hides icon when loading (shows spinner instead)', () => {
    const icon = <span data-testid="test-icon">+</span>;
    render(
      <Button icon={icon} loading>
        Loading
      </Button>
    );
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    const button = screen.getByTestId('button');
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Full width
  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('w-full');
  });

  it('does not apply fullWidth class by default', () => {
    render(<Button>Normal</Button>);
    const button = screen.getByTestId('button');
    expect(button).not.toHaveClass('w-full');
  });

  // Ref forwarding
  it('forwards ref correctly', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain('Ref Button');
  });

  // Click handler
  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>
    );
    await user.click(screen.getByTestId('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
