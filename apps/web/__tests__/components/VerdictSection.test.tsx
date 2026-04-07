import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VerdictSection } from '@/components/results/VerdictSection';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

// ── Fixture builders ─────────────────────────────────────────────

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
    todayScheme: 2_100,
    oct2026Scheme: 2_100,
    confidence: 'low',
    period: 'pre_reform',
    ...overrides,
  };
}

const COMMON_PROPS = {
  volume: 500_000,
  pspName: 'Stripe',
  planType: 'flat' as const,
  msfRate: 0.014,
  surcharging: true,
  surchargeRate: 0.015,
};

// ── Tests ────────────────────────────────────────────────────────

describe('VerdictSection', () => {
  it('renders "Situation N" pill (not "Category N")', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    expect(screen.getByText(/Situation 4/)).toBeInTheDocument();
    // Critical: "Category N" must NOT appear in the pill
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/Category\s*4/);
  });

  it('renders the confidence note "Estimated · RBA averages"', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    expect(screen.getByText(/Estimated · RBA averages/)).toBeInTheDocument();
  });

  it('renders the daily anchor with correct math (-$7,500 → ~$21/day)', () => {
    // Math.round(7500 / 365) = 21
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('$21 more per day');
    expect(text).toContain('in net payments cost');
  });

  it('flips daily anchor copy for a positive plSwing', () => {
    // +$3,650 → $10/day in your pocket
    const positive = makeOutputs({ category: 1, plSwing: 3_650 });
    render(<VerdictSection outputs={positive} {...COMMON_PROPS} planType="costplus" surcharging={false} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('$10 more per day');
    expect(text).toContain('in your pocket');
  });

  it('renders the hero P&L number with the negative sign for cost increase', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    expect(screen.getByText('−$7,500')).toBeInTheDocument();
  });

  it('renders the hero P&L number with the plus sign for a saving', () => {
    const saving = makeOutputs({ plSwing: 4_200 });
    render(<VerdictSection outputs={saving} {...COMMON_PROPS} />);
    expect(screen.getByText('+$4,200')).toBeInTheDocument();
  });

  it('builds the context line for flat-rate + surcharging merchants', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('$500K annual card revenue');
    expect(text).toContain('Stripe flat rate 1.40%');
    expect(text).toContain('surcharging 1.50%');
  });

  it('builds the context line for cost-plus + non-surcharging merchants', () => {
    const outputs = makeOutputs({ category: 1, plSwing: 1_000 });
    render(
      <VerdictSection
        outputs={outputs}
        volume={1_200_000}
        pspName="Tyro"
        planType="costplus"
        msfRate={0}
        surcharging={false}
        surchargeRate={0}
      />,
    );
    const text = document.body.textContent ?? '';
    expect(text).toContain('$1.2M annual card revenue');
    expect(text).toContain('Tyro cost-plus');
    // Surcharging segment must NOT appear
    expect(text).not.toContain('surcharging');
    // Flat rate segment must NOT appear
    expect(text).not.toContain('flat rate');
  });

  it('renders the per-category headline copy', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    expect(
      screen.getByText('You face both challenges simultaneously.'),
    ).toBeInTheDocument();
  });

  it('PSP name appears in the body — never "your PSP"', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    const text = document.body.textContent ?? '';
    expect(text).toContain('Stripe');
    expect(text).not.toMatch(/your PSP/i);
    expect(text).not.toMatch(/your provider/i);
  });
});
