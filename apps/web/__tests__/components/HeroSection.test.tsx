import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/homepage/HeroSection';

describe('HeroSection', () => {
  it('renders the eyebrow badge', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('RBA Surcharge Ban · 1 October 2026'),
    ).toBeInTheDocument();
  });

  it('renders italic "Your" as the signature element', () => {
    render(<HeroSection />);
    const your = screen.getByText('Your');
    expect(your.tagName).toBe('SPAN');
    expect(your.className).toContain('italic');
    expect(your.className).toContain('text-accent');
  });

  it('renders the rest of the headline plain', () => {
    render(<HeroSection />);
    // Match across nodes since the headline is wrapped in spans + br
    expect(document.body.textContent).toContain('Your payments report.');
    expect(document.body.textContent).toContain('Free. In five minutes.');
  });

  it('CTA links to /assessment with new copy', () => {
    render(<HeroSection />);
    const cta = screen.getByRole('link', { name: /get my free report/i });
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

  it('proof row signals independence', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('Independent — no PSP affiliation'),
    ).toBeInTheDocument();
  });
});
