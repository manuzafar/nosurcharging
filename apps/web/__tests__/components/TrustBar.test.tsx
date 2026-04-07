import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBar } from '@/components/homepage/TrustBar';

describe('TrustBar', () => {
  it('renders the customer quote with attribution', () => {
    render(<TrustBar />);
    expect(
      screen.getByText(/I ran the assessment on my lunch break/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('— Café owner, Newtown NSW'),
    ).toBeInTheDocument();
  });

  it('renders the RBA Conclusions Paper citation', () => {
    render(<TrustBar />);
    expect(screen.getByText('RBA Conclusions Paper')).toBeInTheDocument();
    expect(screen.getByText('March 2026 · Verified data')).toBeInTheDocument();
  });

  it('renders the free-tool note', () => {
    render(<TrustBar />);
    expect(screen.getByText('Free tool')).toBeInTheDocument();
    expect(
      screen.getByText('No account · No sales funnel'),
    ).toBeInTheDocument();
  });

  it('uses paper-white surface and rule top/bottom borders', () => {
    const { container } = render(<TrustBar />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('bg-paper-white');
    expect(bar.className).toContain('border-rule');
  });
});
