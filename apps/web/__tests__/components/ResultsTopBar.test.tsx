import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsTopBar } from '@/components/results/shell/ResultsTopBar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('ResultsTopBar', () => {
  it('renders the brand link with full domain', () => {
    render(<ResultsTopBar category={1} plSwing={1700} accuracy={20} />);
    const link = screen.getByText('nosurcharging.com.au');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the category pill', () => {
    render(<ResultsTopBar category={2} plSwing={765} accuracy={45} />);
    expect(screen.getByText('Situation 2')).toBeInTheDocument();
  });

  it('shows positive P&L in success colour', () => {
    render(<ResultsTopBar category={1} plSwing={1700} accuracy={20} />);
    const plEl = screen.getByText('+$1,700');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: 'var(--color-text-success)' });
  });

  it('shows negative P&L in danger colour', () => {
    render(<ResultsTopBar category={3} plSwing={-99500} accuracy={20} />);
    const plEl = screen.getByText('−$99,500');
    expect(plEl).toBeInTheDocument();
    expect(plEl).toHaveStyle({ color: 'var(--color-text-danger)' });
  });

  it('renders accuracy bar with correct width', () => {
    const { container } = render(<ResultsTopBar category={1} plSwing={1700} accuracy={45} />);
    const bar = container.querySelector('[style*="width: 45%"]');
    expect(bar).toBeInTheDocument();
  });

  it('renders accuracy percentage text', () => {
    render(<ResultsTopBar category={1} plSwing={1700} accuracy={45} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders feedback link', () => {
    render(<ResultsTopBar category={1} plSwing={1700} accuracy={20} />);
    expect(screen.getByText('Result looks off?')).toBeInTheDocument();
  });
});
