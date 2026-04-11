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
    const cta = screen.getByRole('link', { name: /generate my free report/i });
    expect(cta).toHaveAttribute('href', '/assessment');
  });

  it('uses paper background and rule bottom border', () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector('section')!;
    expect(section.className).toContain('bg-paper');
    expect(section.className).toContain('border-rule');
  });

  it('does not include banned phrase "your PSP"', () => {
    render(<HeroSection />);
    expect(document.body.textContent ?? '').not.toMatch(/your PSP/i);
  });

  it('proof row mentions Stripe and Square explicitly', () => {
    render(<HeroSection />);
    expect(
      screen.getByText('No Stripe or Square affiliation'),
    ).toBeInTheDocument();
  });
});
