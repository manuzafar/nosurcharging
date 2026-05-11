import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VerdictSection } from '@/components/results/VerdictSection';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

// VerdictSection (Ruthless Cut M2) is the single-block hero: situation
// pill, eyebrow, P&L hero number, one-sentence verdict. Everything
// else (body paragraph, range pill, daily pill, context line) moved
// out of this component in M2 and is exercised in other test files.

function makeOutputs(overrides: Partial<AssessmentOutputs> = {}): AssessmentOutputs {
  return {
    category: 4,
    icSaving: 4_200,
    debitSaving: 1_200,
    creditSaving: 3_000,
    todayInterchange: 12_000,
    todayMargin: 8_000,
    grossCOA: 25_000,
    annualMSF: 28_000,
    surchargeRevenue: 7_500,
    netToday: 20_500,
    octNet: 28_000,
    plSwing: -7_500,
    plSwingLow: -7_500,
    plSwingHigh: -7_500,
    rangeDriver: 'card_mix' as const,
    rangeNote: '',
    todayScheme: 2_100,
    oct2026Scheme: 2_100,
    merchantEffectiveRate: 0.014,
    postReformIcRate: 0.005,
    weightedSchemeRate: 0.00105,
    confidence: 'low',
    period: 'pre_reform',
    ...overrides,
  };
}

describe('VerdictSection — hero block', () => {
  it('renders the situation pill with the category number', () => {
    render(<VerdictSection outputs={makeOutputs({ category: 4 })} />);
    expect(screen.getByText('Situation 4')).toBeInTheDocument();
  });

  it('renders the eyebrow "Estimated annual P&L impact from October 2026"', () => {
    render(<VerdictSection outputs={makeOutputs()} />);
    // jsdom converts the `&amp;` HTML entity back into a literal "&".
    expect(
      screen.getByText(/Estimated annual P&L impact from October 2026/i),
    ).toBeInTheDocument();
  });

  it('renders the signed P&L hero number', () => {
    render(<VerdictSection outputs={makeOutputs({ plSwing: -7_500 })} />);
    expect(screen.getByText('−$7,500')).toBeInTheDocument();
  });

  it('renders the one-sentence CATEGORY_VERDICTS line', () => {
    render(<VerdictSection outputs={makeOutputs({ category: 1 })} />);
    expect(
      screen.getByText('Your costs fall automatically on 1 October.'),
    ).toBeInTheDocument();
  });

  it('positive P&L renders + sign and success colour', () => {
    const { container } = render(
      <VerdictSection outputs={makeOutputs({ plSwing: 5_000, category: 1 })} />,
    );
    expect(screen.getByText('+$5,000')).toBeInTheDocument();
    const heroEl = container.querySelector('p.font-mono');
    const style = heroEl?.getAttribute('style') ?? '';
    expect(style).toContain('--color-text-success');
  });

  it('negative P&L renders − sign and danger colour', () => {
    const { container } = render(
      <VerdictSection outputs={makeOutputs({ plSwing: -3_300, category: 4 })} />,
    );
    expect(screen.getByText('−$3,300')).toBeInTheDocument();
    const heroEl = container.querySelector('p.font-mono');
    const style = heroEl?.getAttribute('style') ?? '';
    expect(style).toContain('--color-text-danger');
  });

  it('does not render the legacy daily pill or range pill (M2 removed)', () => {
    render(<VerdictSection outputs={makeOutputs({ plSwing: -3_300 })} />);
    expect(screen.queryByText(/more per day/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Range$/i)).not.toBeInTheDocument();
  });

  it('does not render the legacy body paragraph (moved to ContextParagraph)', () => {
    render(<VerdictSection outputs={makeOutputs({ category: 4 })} />);
    expect(
      screen.queryByText(/face two challenges simultaneously/i),
    ).not.toBeInTheDocument();
  });
});
