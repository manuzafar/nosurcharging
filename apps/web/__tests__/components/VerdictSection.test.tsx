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
    plSwingLow: -7_500,
    plSwingHigh: -7_500,
    rangeDriver: 'card_mix' as const,
    rangeNote: '',
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

  it('renders the confidence note "Estimated · market averages"', () => {
    render(<VerdictSection outputs={makeOutputs()} {...COMMON_PROPS} />);
    expect(screen.getByText(/Estimated · market averages/)).toBeInTheDocument();
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

  it('renders the hero P&L number WITHOUT a sign when plSwing is exactly 0', () => {
    // Cat 2 default state — flat rate, slider at 0% pass-through.
    // A "+$0" hero contradicts the headline "the saving exists but won't
    // arrive automatically". Render plain "$0" instead.
    const zero = makeOutputs({ category: 2, plSwing: 0 });
    render(<VerdictSection outputs={zero} {...COMMON_PROPS} planType="flat" surcharging={false} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    // No "+$0" anywhere — guard against the regression
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('+$0');
    expect(text).not.toContain('−$0');
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

  describe('Category 5 — zero-cost EFTPOS', () => {
    function cat5Outputs(): AssessmentOutputs {
      return makeOutputs({
        category: 5,
        netToday: 0,
        octNet: 8_400,
        plSwing: -8_400,
        plSwingLow: -9_600,
        plSwingHigh: -7_200,
        rangeDriver: 'post_reform_rate',
        rangeNote: 'Range shows 1.2%–1.6% post-reform rate scenarios. Centre uses 1.4% market benchmark.',
        estimatedMSFRate: 0.014,
      });
    }

    it('renders "Situation 5" pill', () => {
      render(<VerdictSection outputs={cat5Outputs()} {...COMMON_PROPS} planType="zero_cost" />);
      expect(screen.getByText(/Situation 5/)).toBeInTheDocument();
    });

    it('renders the Cat 5 verdict headline', () => {
      render(<VerdictSection outputs={cat5Outputs()} {...COMMON_PROPS} planType="zero_cost" />);
      expect(
        screen.getByText('Your zero-cost plan ends on 1 October.'),
      ).toBeInTheDocument();
    });

    it('context line shows "zero-cost EFTPOS" not flat-rate %', () => {
      render(
        <VerdictSection
          outputs={cat5Outputs()}
          volume={600_000}
          pspName="Square"
          planType="zero_cost"
          msfRate={0}
          surcharging={false}
          surchargeRate={0}
        />,
      );
      const text = document.body.textContent ?? '';
      expect(text).toContain('Square zero-cost EFTPOS');
      expect(text).not.toContain('flat rate');
    });

    it('body explains the PSP-mediated surcharge ending and the post-October rate', () => {
      render(<VerdictSection outputs={cat5Outputs()} {...COMMON_PROPS} pspName="Square" planType="zero_cost" />);
      const text = document.body.textContent ?? '';
      expect(text).toContain('You currently pay $0');
      expect(text).toContain('flat-rate plan');
      expect(text).toContain('Square');
      expect(text).not.toMatch(/your PSP/i);
    });

    it('range expected line uses the 1.4% market estimate descriptor', () => {
      render(<VerdictSection outputs={cat5Outputs()} {...COMMON_PROPS} planType="zero_cost" />);
      const text = document.body.textContent ?? '';
      expect(text).toContain('1.4% market estimate');
    });

    it('daily anchor reads as "in net payments cost" for the negative plSwing', () => {
      render(<VerdictSection outputs={cat5Outputs()} {...COMMON_PROPS} planType="zero_cost" />);
      const text = document.body.textContent ?? '';
      // Math.round(8400 / 365) = 23
      expect(text).toContain('$23 more per day');
      expect(text).toContain('in net payments cost');
    });
  });
});
