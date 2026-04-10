import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProblemsBlock } from '@/components/results/ProblemsBlock';

const COMMON = {
  pspName: 'Stripe',
  surchargeRevenue: 7_500,
  icSaving: 4_200,
};

describe('ProblemsBlock', () => {
  it('renders nothing for Cat 1 (cost-plus, not surcharging)', () => {
    const { container } = render(<ProblemsBlock category={1} {...COMMON} />);
    expect(container.firstChild).toBeNull();
  });

  describe('Cat 2 (flat, not surcharging)', () => {
    it('shows DEPENDS variant only', () => {
      render(<ProblemsBlock category={2} {...COMMON} />);
      expect(screen.getByText(/depends on your plan/i)).toBeInTheDocument();
      expect(screen.queryByText(/^Certain$/i)).not.toBeInTheDocument();
    });

    it('DEPENDS body interpolates PSP name and ic saving', () => {
      render(<ProblemsBlock category={2} {...COMMON} />);
      const text = document.body.textContent ?? '';
      expect(text).toContain('Stripe');
      expect(text).toContain('$4,200/year');
    });

    it('DEPENDS title is the spec wording', () => {
      render(<ProblemsBlock category={2} {...COMMON} />);
      expect(
        screen.getByText(
          /A processing cost reduction may or may not flow through/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Cat 3 (cost-plus, surcharging)', () => {
    it('shows CERTAIN variant only', () => {
      render(<ProblemsBlock category={3} {...COMMON} />);
      expect(screen.getByText(/^Certain$/i)).toBeInTheDocument();
      expect(screen.queryByText(/depends on your plan/i)).not.toBeInTheDocument();
    });

    it('CERTAIN body interpolates surcharge revenue', () => {
      render(<ProblemsBlock category={3} {...COMMON} />);
      const text = document.body.textContent ?? '';
      expect(text).toContain('$7,500/year');
    });

    it('CERTAIN title is the spec wording', () => {
      render(<ProblemsBlock category={3} {...COMMON} />);
      expect(
        screen.getByText(/Your surcharge revenue disappears/i),
      ).toBeInTheDocument();
    });
  });

  describe('Cat 4 (flat, surcharging)', () => {
    it('shows BOTH CERTAIN and DEPENDS variants', () => {
      render(<ProblemsBlock category={4} {...COMMON} />);
      expect(screen.getByText(/^Certain$/i)).toBeInTheDocument();
      expect(screen.getByText(/depends on your plan/i)).toBeInTheDocument();
    });

    it('CERTAIN comes before DEPENDS in the DOM', () => {
      render(<ProblemsBlock category={4} {...COMMON} />);
      const certain = screen.getByText(/Your surcharge revenue disappears/i);
      const depends = screen.getByText(
        /A processing cost reduction may or may not flow through/i,
      );
      // certain.compareDocumentPosition(depends) returns DOCUMENT_POSITION_FOLLOWING
      // (= 4) when depends comes after certain.
      // eslint-disable-next-line no-bitwise
      expect(
        certain.compareDocumentPosition(depends) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('contains the section eyebrow "WHY THIS IS HAPPENING"', () => {
      render(<ProblemsBlock category={4} {...COMMON} />);
      expect(screen.getByText(/Why this is happening/i)).toBeInTheDocument();
    });
  });

  it('never contains the banned phrase "your PSP"', () => {
    for (const cat of [2, 3, 4] as const) {
      const { unmount } = render(<ProblemsBlock category={cat} {...COMMON} />);
      const text = document.body.textContent ?? '';
      expect(text).not.toMatch(/your PSP/i);
      unmount();
    }
  });
});
