import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SectionHeader } from '@/components/results/SectionHeader';

describe('SectionHeader', () => {
  it('renders the eyebrow text', () => {
    render(<SectionHeader eyebrow="The numbers" />);
    expect(screen.getByText('The numbers')).toBeInTheDocument();
  });

  it('renders the optional meta text', () => {
    render(<SectionHeader eyebrow="Refine your estimate" meta="65%" />);
    expect(screen.getByText('Refine your estimate')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('omits the meta paragraph when meta is undefined', () => {
    const { container } = render(<SectionHeader eyebrow="The numbers" />);
    // Header renders one outer wrapper + one inner flex row + one
    // eyebrow <p>. No second <p> for the meta.
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
  });

  it('applies metaColor override to the meta paragraph', () => {
    render(
      <SectionHeader
        eyebrow="Refine your estimate"
        meta="65%"
        metaColor="var(--color-text-success)"
      />,
    );
    const meta = screen.getByText('65%');
    const style = meta.getAttribute('style') ?? '';
    expect(style).toContain('--color-text-success');
  });

  it('renders a hairline rule above the eyebrow row', () => {
    const { container } = render(<SectionHeader eyebrow="The numbers" />);
    // The hairline lives on the inner flex container as a borderTop.
    const hairlineHost = container.querySelector('[style*="border-top"]');
    expect(hairlineHost).not.toBeNull();
  });

  it('eyebrow uses uppercase + 0.14em letter-spacing per the editorial spec', () => {
    render(<SectionHeader eyebrow="The numbers" />);
    const eyebrow = screen.getByText('The numbers');
    expect(eyebrow.className).toContain('uppercase');
    const style = eyebrow.getAttribute('style') ?? '';
    expect(style).toContain('letter-spacing: 0.14em');
  });
});
