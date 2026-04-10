import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewSection } from '@/components/homepage/PreviewSection';

describe('PreviewSection (situations grid)', () => {
  it('renders the section heading and eyebrow', () => {
    render(<PreviewSection />);
    expect(screen.getByText('Which situation are you in?')).toBeInTheDocument();
    expect(
      screen.getByText('Four types of merchant. Find yours.'),
    ).toBeInTheDocument();
  });

  it('renders all four situations with "Situation N" labels (not "Category N")', () => {
    render(<PreviewSection />);
    expect(screen.getByText('Situation 1')).toBeInTheDocument();
    expect(screen.getByText('Situation 2')).toBeInTheDocument();
    expect(screen.getByText('Situation 3')).toBeInTheDocument();
    expect(screen.getByText('Situation 4')).toBeInTheDocument();
    // Banned: "Category N" must not appear on the homepage
    expect(document.body.textContent ?? '').not.toMatch(/Category [1-4]/);
  });

  it('renders all four situation titles verbatim', () => {
    render(<PreviewSection />);
    expect(
      screen.getByText("You don't surcharge — costs itemised"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You don't surcharge — one flat rate"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('You surcharge — costs itemised'),
    ).toBeInTheDocument();
    expect(screen.getByText('You surcharge — one flat rate')).toBeInTheDocument();
  });

  it('renders illustrative P&L numbers in monospace', () => {
    render(<PreviewSection />);
    expect(screen.getByText('+$1,725/yr')).toBeInTheDocument();
    expect(screen.getByText('$0–+$1,725/yr')).toBeInTheDocument();
    expect(screen.getByText('−$111,377/yr')).toBeInTheDocument();
    expect(screen.getByText('−$34,836/yr')).toBeInTheDocument();
  });

  it('shows volume notes for situations 3 and 4', () => {
    render(<PreviewSection />);
    expect(screen.getByText('example: $10M volume')).toBeInTheDocument();
    expect(screen.getByText('example: $3M volume')).toBeInTheDocument();
  });

  it('does not include banned phrase "your PSP"', () => {
    render(<PreviewSection />);
    expect(document.body.textContent ?? '').not.toMatch(/your PSP/i);
  });

  it('uses "your payment provider" wording for situation 2 action', () => {
    render(<PreviewSection />);
    expect(
      screen.getByText(/Ask your payment provider whether your rate adjusts/),
    ).toBeInTheDocument();
  });
});
