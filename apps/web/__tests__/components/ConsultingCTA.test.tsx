import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const trackEventMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

import { ConsultingCTA } from '@/components/results/ConsultingCTA';

describe('ConsultingCTA', () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it('renders the spec headline with PSP name inline', () => {
    render(<ConsultingCTA category={2} pspName="Stripe" />);
    expect(
      screen.getByText(
        /Walk into October knowing exactly what to say to Stripe, what to charge customers, and whether your rate is fair\./i,
      ),
    ).toBeInTheDocument();
  });

  it('uses the merchant\'s actual PSP name (Tyro), not "your PSP"', () => {
    render(<ConsultingCTA category={4} pspName="Tyro" />);

    expect(screen.getByText(/say to Tyro/i)).toBeInTheDocument();

    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('your PSP');
    expect(allText).not.toContain('your provider');
  });

  it('shows the Reform Ready sub line', () => {
    render(<ConsultingCTA category={1} pspName="Square" />);
    expect(
      screen.getByText(
        /Reform Ready · one engagement · fixed price · April–September 2026/,
      ),
    ).toBeInTheDocument();
  });

  it('shows the discovery call button', () => {
    render(<ConsultingCTA category={3} pspName="CommBank" />);
    const link = screen.getByRole('link', { name: /Book discovery call/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the price note "$3,500 · Reform Ready"', () => {
    render(<ConsultingCTA category={2} pspName="Stripe" />);
    expect(screen.getByText(/\$3,500 · Reform Ready/)).toBeInTheDocument();
  });

  it('does not show category-specific dollar amounts (single offer)', () => {
    render(<ConsultingCTA category={2} pspName="Stripe" />);
    const allText = document.body.textContent ?? '';
    // Old copy mentioned $2,500 health-check; new spec is single $3,500 offer
    expect(allText).not.toContain('$2,500');
  });

  it('renders a single CTA — copy is identical across categories', () => {
    const { rerender } = render(<ConsultingCTA category={1} pspName="Stripe" />);
    const firstHeadline = screen.getByText(/Walk into October/i).textContent;

    for (const cat of [2, 3, 4] as const) {
      rerender(<ConsultingCTA category={cat} pspName="Stripe" />);
      expect(screen.getByText(/Walk into October/i).textContent).toBe(firstHeadline);
    }
  });

  it('fires Plausible "CTA clicked" event with category prop on click', async () => {
    const user = userEvent.setup();
    render(<ConsultingCTA category={3} pspName="Stripe" />);
    await user.click(screen.getByRole('link', { name: /Book discovery call/i }));
    expect(trackEventMock).toHaveBeenCalledWith('CTA clicked', { category: '3' });
  });
});
