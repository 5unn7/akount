import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Card, CardHeader } from '../Card';

describe('Card', () => {
  it('renders children content', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with data-testid="card"', () => {
    render(<Card>Test</Card>);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  // Variant tests
  it('renders with default variant classes', () => {
    render(<Card>Default</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-sm');
  });

  it('renders elevated variant with correct classes', () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg');
  });

  it('renders flat variant with correct classes', () => {
    render(<Card variant="flat">Flat</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-none');
  });

  it('renders glass variant with correct classes', () => {
    render(<Card variant="glass">Glass</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-md');
    expect(card).toHaveClass('backdrop-blur-xl');
  });

  // Padding tests
  it('applies default padding (md) classes', () => {
    render(<Card>Padded</Card>);
    const card = screen.getByTestId('card');
    // The content div inside the card should have p-4
    const contentDiv = card.querySelector('.p-4');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies sm padding', () => {
    render(<Card padding="sm">Small Pad</Card>);
    const card = screen.getByTestId('card');
    const contentDiv = card.querySelector('.p-3');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies lg padding', () => {
    render(<Card padding="lg">Large Pad</Card>);
    const card = screen.getByTestId('card');
    const contentDiv = card.querySelector('.p-6');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies no padding when padding="none"', () => {
    render(<Card padding="none">No Pad</Card>);
    const card = screen.getByTestId('card');
    // Content area should not have p-3, p-4, or p-6
    const children = card.children;
    for (let i = 0; i < children.length; i++) {
      expect(children[i]).not.toHaveClass('p-3');
      expect(children[i]).not.toHaveClass('p-4');
      expect(children[i]).not.toHaveClass('p-6');
    }
  });

  // Interactive mode tests
  it('interactive mode adds role="button" and tabIndex=0', () => {
    render(<Card interactive>Interactive</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('non-interactive mode does not add role or tabIndex', () => {
    render(<Card>Non-interactive</Card>);
    const card = screen.getByTestId('card');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
  });

  it('interactive mode handles Enter key press', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Card interactive onClick={handleClick}>
        Press Enter
      </Card>
    );
    const card = screen.getByTestId('card');
    card.focus();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('interactive mode handles Space key press', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Card interactive onClick={handleClick}>
        Press Space
      </Card>
    );
    const card = screen.getByTestId('card');
    card.focus();
    await user.keyboard('{ }');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Header and footer slots
  it('renders header slot', () => {
    render(
      <Card header={<div data-testid="card-header">Header</div>}>
        Content
      </Card>
    );
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders footer slot', () => {
    render(
      <Card footer={<div data-testid="card-footer">Footer</div>}>
        Content
      </Card>
    );
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('does not render header section when no header prop', () => {
    render(<Card>No Header</Card>);
    const card = screen.getByTestId('card');
    // Only the content div should be present (no border-b header div)
    const borderBDivs = card.querySelectorAll('.border-b');
    expect(borderBDivs).toHaveLength(0);
  });

  // Ref forwarding
  it('forwards ref correctly', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<CardHeader title="Title" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders action slot', () => {
    render(
      <CardHeader
        title="Title"
        action={<button data-testid="action-btn">Action</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('passes className prop', () => {
    const { container } = render(
      <CardHeader title="Title" className="custom-header" />
    );
    expect(container.firstChild).toHaveClass('custom-header');
  });
});
