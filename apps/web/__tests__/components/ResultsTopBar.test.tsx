import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsTopBar } from '@/components/results/shell/ResultsTopBar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock FeedbackModal to avoid portal issues in test
vi.mock('@/components/results/FeedbackModal', () => ({
  FeedbackModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="feedback-modal"><button onClick={onClose}>Close</button></div> : null,
}));

const defaultProps = {
  category: 1 as const,
  plSwing: 1700,
  accuracy: 20,
  volume: 500_000,
  assessmentId: 'test-123',
};

describe('ResultsTopBar', () => {
  it('renders the brand link with full domain', () => {
    render(<ResultsTopBar {...defaultProps} />);
    const link = screen.getByText('nosurcharging.com.au');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the category pill', () => {
    render(<ResultsTopBar {...defaultProps} category={2} plSwing={765} accuracy={45} />);
    expect(screen.getByText('Situation 2')).toBeInTheDocument();
  });

  it('shows positive P&L in success colour', () => {
    render(<ResultsTopBar {...defaultProps} />);
    const plEl = screen.getByText('+$1,700');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: 'var(--color-text-success)' });
  });

  it('shows negative P&L in danger colour', () => {
    render(<ResultsTopBar {...defaultProps} category={3} plSwing={-99500} />);
    const plEl = screen.getByText('−$99,500');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: 'var(--color-text-danger)' });
  });

  it('renders accuracy bar with correct width', () => {
    const { container } = render(<ResultsTopBar {...defaultProps} accuracy={45} />);
    const bar = container.querySelector('[style*="width: 45%"]');
    expect(bar).toBeInTheDocument();
  });

  it('renders accuracy percentage text', () => {
    render(<ResultsTopBar {...defaultProps} accuracy={45} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders feedback link', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.getByText('Result looks off?')).toBeInTheDocument();
  });

  it('opens feedback modal when "Result looks off?" is clicked', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Result looks off?'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('P&L number renders at 18px with weight 500', () => {
    render(<ResultsTopBar {...defaultProps} />);
    const plEl = screen.getByText('+$1,700');
    expect(plEl).toHaveStyle({ fontSize: '18px', fontWeight: 500 });
  });
});
