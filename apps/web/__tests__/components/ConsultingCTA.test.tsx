import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const ctaClickedMock = vi.fn();
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  Analytics: {
    ctaClicked: (...args: unknown[]) => ctaClickedMock(...args),
  },
}));

import { ConsultingCTA } from '@/components/results/ConsultingCTA';

describe('ConsultingCTA', () => {
  beforeEach(() => {
    ctaClickedMock.mockClear();
  });

  it('Cat 1 shows $2,500 and Payments Health Check', () => {
    render(<ConsultingCTA category={1} pspName="Square" />);
    expect(screen.getByText('Payments Health Check')).toBeInTheDocument();
    expect(screen.getByText(/Book a call · \$2,500/)).toBeInTheDocument();
  });

  it('Cat 2 shows $2,500 and interpolates PSP name', () => {
    render(<ConsultingCTA category={2} pspName="Stripe" />);
    expect(screen.getByText(/Stripe needs to change your rate/)).toBeInTheDocument();
    expect(screen.getByText(/Book a call · \$2,500/)).toBeInTheDocument();
  });

  it('Cat 3 shows $3,500 and Reform Ready', () => {
    render(<ConsultingCTA category={3} pspName="CommBank" />);
    expect(screen.getByText('Reform Ready')).toBeInTheDocument();
    expect(screen.getByText(/repricing strategy/)).toBeInTheDocument();
    expect(screen.getByText(/Book a call · \$3,500/)).toBeInTheDocument();
  });

  it('Cat 4 shows $3,500 and Reform Ready', () => {
    render(<ConsultingCTA category={4} pspName="Tyro" />);
    expect(screen.getByText('Reform Ready')).toBeInTheDocument();
    expect(screen.getByText(/Two problems, one October deadline/)).toBeInTheDocument();
    expect(screen.getByText(/Book a call · \$3,500/)).toBeInTheDocument();
  });

  it('does not use "your PSP" or "your provider"', () => {
    render(<ConsultingCTA category={2} pspName="Tyro" />);
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('your PSP');
    expect(allText).not.toContain('your provider');
  });

  it('shows detail line "30-minute call"', () => {
    render(<ConsultingCTA category={1} pspName="Square" />);
    expect(screen.getByText(/30-minute call/)).toBeInTheDocument();
  });

  it('CTA link opens in new tab', () => {
    render(<ConsultingCTA category={3} pspName="CommBank" />);
    const link = screen.getByRole('link', { name: /Book a call/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('fires Analytics.ctaClicked with consulting context on click', async () => {
    const user = userEvent.setup();
    render(
      <ConsultingCTA
        category={3}
        pspName="Stripe"
        plSwing={-12500}
        volumeTier="1m-3m"
      />,
    );
    await user.click(screen.getByRole('link', { name: /Book a call/i }));
    expect(ctaClickedMock).toHaveBeenCalledWith({
      cta_type: 'consulting',
      cta_location: 'help_section',
      category: 3,
      pl_swing: -12500,
      volume_tier: '1m-3m',
      psp: 'Stripe',
    });
  });
});
