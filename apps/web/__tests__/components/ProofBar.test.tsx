import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProofBar } from '@/components/homepage/ProofBar';

describe('ProofBar', () => {
  it('renders all three proof statements verbatim', () => {
    render(<ProofBar />);
    expect(
      screen.getByText('Independent — no Stripe or Square affiliation'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Based on RBA Conclusions Paper, March 2026'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Plain English — every term explained'),
    ).toBeInTheDocument();
  });

  it('uses accent-light background and accent-border bottom border', () => {
    const { container } = render(<ProofBar />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('bg-accent-light');
    expect(bar.className).toContain('border-accent-border');
  });

  it('does not include banned phrase "your PSP"', () => {
    render(<ProofBar />);
    expect(document.body.textContent ?? '').not.toMatch(/your PSP/i);
  });
});
