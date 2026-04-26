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

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  Analytics: {
    resultLooksOff: vi.fn(),
    ctaClicked: vi.fn(),
  },
}));

const defaultProps = {
  category: 1 as const,
  plSwing: 1700,
  accuracy: 20,
  volume: 500_000,
  assessmentId: 'test-123',
};

describe('ResultsTopBar', () => {
  it('renders the branded logo linking to home', () => {
    render(<ResultsTopBar {...defaultProps} />);
    // Logo splits "no" / "surcharging" / ".com.au" into spans — assert
    // by anchor href and the italic accent portion.
    const link = screen.getByRole('link', { name: /surcharging/i });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText('surcharging')).toBeInTheDocument();
    expect(screen.getByText('.com.au')).toBeInTheDocument();
  });

  it('renders the situation pill', () => {
    render(<ResultsTopBar {...defaultProps} category={2} plSwing={765} accuracy={45} />);
    expect(screen.getByText('Situation 2')).toBeInTheDocument();
  });

  it('shows positive P&L in emerald colour at 15px monospace 700', () => {
    render(<ResultsTopBar {...defaultProps} />);
    const plEl = screen.getByText('+$1,700');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: '#1A6B5A', fontSize: '15px', fontWeight: 700 });
  });

  it('shows negative P&L in coral/red colour', () => {
    render(<ResultsTopBar {...defaultProps} category={3} plSwing={-99500} />);
    const plEl = screen.getByText('−$99,500');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: '#E57373' });
  });

  it('renders accuracy as inline text with bullet separator', () => {
    render(<ResultsTopBar {...defaultProps} accuracy={45} />);
    expect(screen.getByText('Accuracy ▪ 45%')).toBeInTheDocument();
  });

  it('rounds accuracy to whole percent', () => {
    render(<ResultsTopBar {...defaultProps} accuracy={45.7} />);
    expect(screen.getByText('Accuracy ▪ 46%')).toBeInTheDocument();
  });

  it('renders the "Result looks off?" feedback link', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.getByText('Result looks off?')).toBeInTheDocument();
  });

  it('opens feedback modal when "Result looks off?" is clicked', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Result looks off?'));
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
  });

  it('renders the "Save result" outline button', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Save result' })).toBeInTheDocument();
  });

  it('renders the "Get help" primary CTA', () => {
    render(<ResultsTopBar {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Get help' })).toBeInTheDocument();
  });

  it('header uses dark ink background and 56px height', () => {
    const { container } = render(<ResultsTopBar {...defaultProps} />);
    const header = container.querySelector('header')!;
    expect(header).toHaveStyle({ background: '#1A1409', height: '56px' });
  });
});
