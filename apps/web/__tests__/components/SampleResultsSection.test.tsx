import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SampleResultsSection } from '@/components/homepage/SampleResultsSection';

describe('SampleResultsSection', () => {
  it('renders the eyebrow + section headline', () => {
    render(<SampleResultsSection />);
    expect(screen.getByText('See what merchants get')).toBeInTheDocument();
    expect(screen.getByText('Real reports. Real numbers.')).toBeInTheDocument();
  });

  it('exposes the #samples anchor used by the hero secondary CTA', () => {
    const { container } = render(<SampleResultsSection />);
    const section = container.querySelector('section')!;
    expect(section.id).toBe('samples');
  });

  it('renders all three sample categories with their impact figures', () => {
    render(<SampleResultsSection />);
    // Winner — Cat 1
    expect(screen.getByText('Situation 1')).toBeInTheDocument();
    expect(screen.getByText('+$1,200')).toBeInTheDocument();
    expect(
      screen.getByText('Your costs fall automatically on 1 October.'),
    ).toBeInTheDocument();

    // Conditional — Cat 2
    expect(screen.getByText('Situation 2')).toBeInTheDocument();
    expect(screen.getByText('−$15,300')).toBeInTheDocument();
    expect(
      screen.getByText(/saving exists — but it won't arrive automatically/i),
    ).toBeInTheDocument();

    // High-impact — Cat 4
    expect(screen.getByText('Situation 4')).toBeInTheDocument();
    expect(screen.getByText('−$24,400')).toBeInTheDocument();
    expect(
      screen.getByText('You face both challenges simultaneously.'),
    ).toBeInTheDocument();
  });

  it('renders an action teaser beneath every sample', () => {
    render(<SampleResultsSection />);
    // Each card ends with "Next: <emphasis> + tail". Three cards = three
    // teasers; assert at least the count via the literal "Next:" prefix.
    const teasers = screen.getAllByText(/^Next:/);
    expect(teasers).toHaveLength(3);
  });
});
