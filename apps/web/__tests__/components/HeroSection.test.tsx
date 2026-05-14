import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '@/components/homepage/HeroSection';

describe('HeroSection', () => {
  it('eyebrow pill consolidates the countdown into a single element', () => {
    render(<HeroSection />);
    // Post-revision-brief (May 2026): the eyebrow + adjacent
    // countdown text are merged into a single pill that flips
    // between "{N} days until the surcharge ban" and
    // "The surcharge ban is in effect" automatically.
    const text = document.body.textContent ?? '';
    const matchesCountdown = /\d+\s+days?\s+until\s+the\s+surcharge\s+ban/i.test(text);
    const matchesInEffect = /The surcharge ban is in effect/i.test(text);
    expect(matchesCountdown || matchesInEffect).toBe(true);
    // Old pill copy must NOT reappear.
    expect(text).not.toMatch(/Surcharge ban · 1 October 2026/i);
    expect(text).not.toMatch(/\d+\s+days remaining/i);
  });

  it('headline reads as a direct, plain-ink statement (no italic accent)', () => {
    render(<HeroSection />);
    // Post-May-2026 hero copy: the italic-emerald "Your" treatment
    // now lives only in the subhead's three-Your anaphora. The
    // headline itself is a single declarative sentence in plain
    // serif; it contains the lowercase "your business" but NO <em>
    // wrapper around it.
    const headline = screen.getByRole('heading', { level: 1 });
    expect(headline.textContent).toBe(
      "Find out what October's surcharge ban costs your business.",
    );
    // No <em> children inside the headline — the accent moved to
    // the subhead.
    expect(headline.querySelector('em')).toBeNull();
  });

  it('subhead carries exactly three italic emerald "Your" instances', () => {
    render(<HeroSection />);
    // Post-May-2026: three-Your anaphora lives entirely in the
    // subhead. Each instance must be wrapped in <em> with italic +
    // text-accent classes.
    const yours = screen.getAllByText('Your');
    expect(yours).toHaveLength(3);
    for (const el of yours) {
      expect(el.tagName).toBe('EM');
      expect(el.className).toContain('italic');
      expect(el.className).toContain('text-accent');
    }
  });

  it('subhead contains the three-Your anaphora copy verbatim', () => {
    render(<HeroSection />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Your provider named.');
    expect(text).toContain('Your P&L impact in dollars.');
    expect(text).toContain('Your week-by-week action plan.');
  });

  it('hero copy has no em-dash', () => {
    render(<HeroSection />);
    // Scope to the headline + subhead — the calculator footer copy
    // below preserves a legitimate em-dash use that the revision
    // brief doesn't touch. The subhead text is split across <em> +
    // text nodes inside a <p>, so we walk up from the first "Your"
    // <em> to its parent paragraph to assert the aggregated text.
    const headline = screen.getByRole('heading', { level: 1 });
    const firstYour = screen.getAllByText('Your')[0]!;
    const subhead = firstYour.closest('p')!;
    expect(headline.textContent ?? '').not.toContain('—');
    expect(subhead.textContent ?? '').not.toContain('—');
  });

  it('primary CTA links to /assessment with verbatim "Start my free report" copy', () => {
    render(<HeroSection />);
    const cta = screen.getByRole('link', { name: /start my free report/i });
    expect(cta).toHaveAttribute('href', '/assessment');
  });

  it('does NOT render the deleted secondary CTA "See sample report"', () => {
    render(<HeroSection />);
    expect(
      screen.queryByText(/See sample report/i),
    ).not.toBeInTheDocument();
  });

  it('does NOT render the deleted trust-icon row labels', () => {
    render(<HeroSection />);
    // Three v1 trust signals are explicitly deleted in v2.
    expect(screen.queryByText(/Personalised to your PSP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Independent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No account required/i)).not.toBeInTheDocument();
  });

  it('reassurance line appears verbatim below the CTA', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('No sign-up, no account. Five minutes.'),
    ).toBeInTheDocument();
  });

  it('uses paper background and rule bottom border', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section')!;
    expect(section.className).toContain('bg-paper');
    expect(section.className).toContain('border-rule');
  });

  it('does not include banned vague directives like "call your PSP"', () => {
    render(<HeroSection />);
    expect(document.body.textContent ?? '').not.toMatch(
      /(call|contact|email|ring|tell|ask) your PSP/i,
    );
  });

  // Live calculator preserved per the visual review decision —
  // brief's five-element rule yields to keeping the differentiator.

  it('live calculator renders with the $2M default volume + impact pre-selected', () => {
    render(<HeroSection />);
    expect(screen.getByText('$2,000,000')).toBeInTheDocument();
    expect(screen.getByText('−$24,400')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '$2M' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('clicking a different volume chip updates both volume and impact', async () => {
    const user = userEvent.setup();
    render(<HeroSection />);
    await user.click(screen.getByRole('radio', { name: '$10M' }));
    expect(screen.getByText('$10,000,000')).toBeInTheDocument();
    expect(screen.getByText('−$122,000')).toBeInTheDocument();
  });

  it('calculator footer documents the typical-merchant assumption', () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/flat rate, surcharging at 1\.5%, retail industry/i),
    ).toBeInTheDocument();
  });
});
