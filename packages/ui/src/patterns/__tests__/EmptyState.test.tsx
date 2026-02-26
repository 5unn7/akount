import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

// Mock lucide-react icon — a simple SVG component matching LucideIcon shape
function MockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg data-testid="mock-icon" {...props}>
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState title="Empty" description="Create your first item" />
    );
    expect(screen.getByText('Create your first item')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    // Only one <p> tag (the title)
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe('Empty');
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon={MockIcon} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders without icon when not provided', () => {
    render(<EmptyState title="No Icon" />);
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
  });

  // Variant tests
  it('card variant wraps content in glass container', () => {
    const { container } = render(<EmptyState title="Card" variant="card" />);
    const glassDiv = container.querySelector('.glass');
    expect(glassDiv).toBeInTheDocument();
  });

  it('inline variant does not wrap in glass container', () => {
    const { container } = render(<EmptyState title="Inline" variant="inline" />);
    const glassDiv = container.querySelector('.glass');
    expect(glassDiv).not.toBeInTheDocument();
  });

  it('defaults to card variant', () => {
    const { container } = render(<EmptyState title="Default" />);
    const glassDiv = container.querySelector('.glass');
    expect(glassDiv).toBeInTheDocument();
  });

  // Size tests
  it('renders sm size with correct padding class', () => {
    const { container } = render(
      <EmptyState title="Small" size="sm" variant="inline" />
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('py-8');
  });

  it('renders md size with correct padding class', () => {
    const { container } = render(
      <EmptyState title="Medium" size="md" variant="inline" />
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('p-12');
  });

  it('renders lg size with correct padding class', () => {
    const { container } = render(
      <EmptyState title="Large" size="lg" variant="inline" />
    );
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('py-16');
  });

  // Children (action buttons)
  it('renders children as action buttons', () => {
    render(
      <EmptyState title="Empty">
        <button data-testid="action-btn">Create New</button>
      </EmptyState>
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    expect(screen.getByText('Create New')).toBeInTheDocument();
  });

  // Progress bar tests
  it('renders progress bar with label and fraction', () => {
    render(
      <EmptyState
        title="Setup"
        progress={{ current: 2, total: 4, label: 'Setup progress' }}
      />
    );
    expect(screen.getByText('Setup progress')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
  });

  it('progress bar width matches percentage', () => {
    const { container } = render(
      <EmptyState
        title="Progress"
        progress={{ current: 3, total: 6, label: 'Progress' }}
      />
    );
    // Find the inner progress bar div (the one with bg-primary)
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('progress bar handles zero total gracefully', () => {
    const { container } = render(
      <EmptyState
        title="Zero"
        progress={{ current: 0, total: 0, label: 'Empty' }}
      />
    );
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  // className prop
  it('passes className prop to card variant outer element', () => {
    const { container } = render(
      <EmptyState title="Styled" className="custom-empty" />
    );
    const glassDiv = container.querySelector('.glass');
    expect(glassDiv).toHaveClass('custom-empty');
  });
});
