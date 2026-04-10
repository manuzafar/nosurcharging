import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesSection } from '@/components/homepage/FeaturesSection';

describe('FeaturesSection', () => {
  it('renders the eyebrow label', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Four questions. Your report.')).toBeInTheDocument();
  });

  it('renders all four step numbers', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('renders all four questions verbatim', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText('How much do you process in card payments?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Does your statement show one rate, or a breakdown?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Do you add a surcharge to card payments?'),
    ).toBeInTheDocument();
    expect(screen.getByText('What industry are you in?')).toBeInTheDocument();
  });

  it('renders the supporting hint for each step', () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(
        'We calculate your actual dollar impact — not a percentage, a number.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the biggest variable/),
    ).toBeInTheDocument();
  });

  it('uses paper background and rule bottom border', () => {
    const { container } = render(<FeaturesSection />);
    const section = container.querySelector('section')!;
    expect(section.className).toContain('bg-paper');
    expect(section.className).toContain('border-rule');
  });

  it('does not include banned phrase "your PSP"', () => {
    render(<FeaturesSection />);
    expect(document.body.textContent ?? '').not.toMatch(/your PSP/i);
  });
});
