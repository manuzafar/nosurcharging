import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '@/components/homepage/HeroSection';

describe('HeroSection', () => {
  it('renders the eyebrow badge with the new date format', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('Surcharge ban · 1 October 2026'),
    ).toBeInTheDocument();
  });

  it('renders italic "Your" as the signature element', () => {
    render(<HeroSection />);
    const your = screen.getByText('Your');
    // The new hero wraps the accent word in an <em> for semantics + italics.
    expect(your.tagName).toBe('EM');
    expect(your.className).toContain('italic');
    expect(your.className).toContain('text-accent');
  });

  it('renders the rest of the headline plain', () => {
    render(<HeroSection />);
    // Match across nodes since the headline is wrapped in spans + br
    expect(document.body.textContent).toContain('payments report.');
    expect(document.body.textContent).toContain('Free. In five minutes.');
  });

  it('primary CTA links to /assessment with the new "Start my free report" copy', () => {
    render(<HeroSection />);
    const cta = screen.getByRole('link', { name: /start my free report/i });
    expect(cta).toHaveAttribute('href', '/assessment');
  });

  it('uses paper background and rule bottom border', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section')!;
    expect(section.className).toContain('bg-paper');
    expect(section.className).toContain('border-rule');
  });

  // CLAUDE.md §12 Rule 10 bans vague directives like "call your PSP" in
  // ACTION ITEMS (results page). On the homepage the merchant has no PSP
  // selected yet, so "your PSP" is unavoidable as a noun in marketing copy.
  // This test guards against the directive forms only.
  it('does not include banned vague directives like "call your PSP"', () => {
    render(<HeroSection />);
    expect(document.body.textContent ?? '').not.toMatch(
      /(call|contact|email|ring|tell|ask) your PSP/i,
    );
  });

  it('trust row signals independence', () => {
    render(<HeroSection />);
    // Refreshed copy: a single "Independent" label (was "Independent —
    // no PSP affiliation"); the longer phrasing was redundant against
    // the dedicated independence line in the footer.
    expect(screen.getByText('Independent')).toBeInTheDocument();
    expect(screen.getByText('Personalised to your PSP')).toBeInTheDocument();
    expect(screen.getByText('No account required')).toBeInTheDocument();
  });

  it('live calculator renders with the $2M default volume + impact pre-selected', () => {
    render(<HeroSection />);
    // Default bracket per the lookup table — matches the brief's anchor
    // example ($2M → −$24,400).
    expect(screen.getByText('$2,000,000')).toBeInTheDocument();
    expect(screen.getByText('−$24,400')).toBeInTheDocument();
    // The 2M chip should be the checked radio.
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
    expect(screen.getByRole('radio', { name: '$10M' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    // The previous default chip should now be unchecked.
    expect(screen.getByRole('radio', { name: '$2M' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('calculator footer documents the typical-merchant assumption', () => {
    render(<HeroSection />);
    // The lookup table is computed assuming Cat 4 (flat + 1.5% surcharge,
    // retail industry). The footer surfaces that assumption so the
    // visitor knows the figure is indicative.
    expect(
      screen.getByText(/flat rate, surcharging at 1\.5%, retail industry/i),
    ).toBeInTheDocument();
  });
});
