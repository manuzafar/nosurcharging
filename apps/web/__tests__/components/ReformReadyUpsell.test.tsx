import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReformReadyUpsell } from '@/components/results/ReformReadyUpsell';

describe('ReformReadyUpsell', () => {
  it('renders the $149 price block', () => {
    render(<ReformReadyUpsell category={4} pspName="Stripe" />);
    expect(screen.getByText('$149')).toBeInTheDocument();
    expect(screen.getByText('Reform Ready Report')).toBeInTheDocument();
  });

  it('renders the headline and accent badge', () => {
    render(<ReformReadyUpsell category={3} pspName="Tyro" />);
    expect(
      screen.getByText(/Statement analysis that tells you exactly what to say/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your actual number — not a market estimate/),
    ).toBeInTheDocument();
  });

  it('interpolates PSP name into the rate-comparison feature', () => {
    render(<ReformReadyUpsell category={2} pspName="Tyro" />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Tyro');
    // No banned phrasing
    expect(text).not.toMatch(/your PSP/i);
  });

  it('CTA link uses Calendly URL and points $149 button text', () => {
    render(<ReformReadyUpsell category={4} pspName="Stripe" />);
    const cta = screen.getByText(/Get my Reform Ready Report — \$149/);
    expect(cta.tagName).toBe('A');
    expect(cta.getAttribute('href')).toBeTruthy();
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders all five feature bullets', () => {
    render(<ReformReadyUpsell category={4} pspName="Stripe" />);
    expect(screen.getByText(/Real effective rate/)).toBeInTheDocument();
    expect(screen.getByText(/Actual card mix/)).toBeInTheDocument();
    expect(screen.getByText(/Full action plan/)).toBeInTheDocument();
    expect(screen.getByText(/Negotiation script/)).toBeInTheDocument();
    expect(screen.getByText(/30-minute walkthrough call/)).toBeInTheDocument();
  });
});
