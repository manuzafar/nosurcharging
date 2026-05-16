import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsTopBar } from '@/components/results/shell/ResultsTopBar';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Post-RESULTS_HEADER_REDESIGN_BRIEF (May 2026): the header is stripped to
// two elements — brand wordmark + "Start a new report →" link. Every
// other element (Situation chip, plSwing display, "Result looks off?"
// button) was removed or relocated. The component now takes zero props.

describe('ResultsTopBar', () => {
  it('renders the branded logo linking to home', () => {
    render(<ResultsTopBar />);
    const link = screen.getByRole('link', { name: /surcharging/i });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByText('surcharging')).toBeInTheDocument();
    expect(screen.getByText('.com.au')).toBeInTheDocument();
  });

  it('renders the "Start a new report" restart link to /assessment', () => {
    render(<ResultsTopBar />);
    // The label has both a wide-viewport version ("Start a new report")
    // and a narrow-viewport short version ("New report") in the DOM; CSS
    // controls which is visible. Asserting the link's href covers both.
    const link = screen.getByRole('link', { name: /new report/i });
    expect(link).toHaveAttribute('href', '/assessment');
  });

  it('renders only TWO links — brand + restart. No other interactive elements', () => {
    render(<ResultsTopBar />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('header uses dark ink background and 56px height', () => {
    const { container } = render(<ResultsTopBar />);
    const header = container.querySelector('header')!;
    expect(header).toHaveStyle({ background: '#1A1409', height: '56px' });
  });

  // Regression guards — these elements MUST stay gone after the May 2026
  // header decongestion. Re-introducing any of them is a brief regression.

  it('does not render the legacy Situation chip', () => {
    render(<ResultsTopBar />);
    expect(screen.queryByText(/Situation \d/)).not.toBeInTheDocument();
  });

  it('does not render any dollar value in the header', () => {
    render(<ResultsTopBar />);
    // Both signed-dollar forms (+$X, −$X) and plain $X must be absent.
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/[+−]?\$\d/);
  });

  it('does not render the legacy "Result looks off?" button', () => {
    render(<ResultsTopBar />);
    expect(screen.queryByText(/Result looks off/i)).not.toBeInTheDocument();
  });

  it('does not render the legacy "Save result" button', () => {
    render(<ResultsTopBar />);
    expect(screen.queryByRole('button', { name: 'Save result' })).not.toBeInTheDocument();
  });

  it('does not render the legacy "Get help" CTA', () => {
    render(<ResultsTopBar />);
    expect(screen.queryByRole('link', { name: 'Get help' })).not.toBeInTheDocument();
  });
});
