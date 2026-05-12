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

  it('renders italic emerald "Your" in the headline', () => {
    render(<HeroSection />);
    // Multiple "Your" instances — the headline + three subhead
    // anaphora references. `getAllByText` returns them all; check
    // that the FIRST is the headline (an <em>).
    const yours = screen.getAllByText('Your');
    expect(yours.length).toBeGreaterThanOrEqual(4);
    const headlineYour = yours[0]!;
    expect(headlineYour.tagName).toBe('EM');
    expect(headlineYour.className).toContain('italic');
    expect(headlineYour.className).toContain('text-accent');
  });

  it('renders the headline copy verbatim', () => {
    render(<HeroSection />);
    expect(document.body.textContent).toContain('payments report.');
    expect(document.body.textContent).toContain('Free. In five minutes.');
  });

  it('subhead carries three additional italic emerald "Your" instances', () => {
    render(<HeroSection />);
    // 1 headline + 3 subhead = 4 total "Your" instances. Every
    // subhead instance must also be styled italic emerald.
    const yours = screen.getAllByText('Your');
    expect(yours).toHaveLength(4);
    for (const el of yours.slice(1)) {
      expect(el.tagName).toBe('EM');
      expect(el.className).toContain('italic');
      expect(el.className).toContain('text-accent');
    }
  });

  it('subhead opens with "Find out what October\'s surcharge ban costs your business."', () => {
    render(<HeroSection />);
    expect(document.body.textContent).toContain(
      "Find out what October's surcharge ban costs your business.",
    );
  });

  it('subhead has no em-dash (banned in v2)', () => {
    render(<HeroSection />);
    // Scope to the subhead paragraph specifically — the calculator
    // footer copy below it preserves a legitimate em-dash use that
    // the revision brief doesn't touch.
    const subhead = screen.getByText(
      /^Find out what October's surcharge ban costs your business/,
    );
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
