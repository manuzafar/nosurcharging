import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Track calculateMetrics calls ─────────────────────────────────

let calcCallCount = 0;
const COST_PLUS_OCT_NET = 7676.92; // fixed value for cost-plus escape

vi.mock('@nosurcharging/calculations/rules/resolver', () => ({
  resolveAssessmentInputs: vi.fn((raw: { passThrough: number; planType: string }) => raw),
}));

vi.mock('@nosurcharging/calculations/calculations', () => ({
  calculateMetrics: vi.fn((resolved: { passThrough: number; planType: string }) => {
    calcCallCount++;
    if (resolved.planType === 'costplus') {
      return { octNet: COST_PLUS_OCT_NET };
    }
    // Flat rate path — should not be hit by EscapeScenarioCard, but kept defensively
    return { octNet: 28000 };
  }),
}));

import { EscapeScenarioCard } from '@/components/results/EscapeScenarioCard';
import type { AssessmentOutputs, RawAssessmentData, ResolutionContext } from '@nosurcharging/calculations/types';

const BASE_OUTPUTS: AssessmentOutputs = {
  category: 2,
  icSaving: 1724.62,
  debitSaving: 184.62,
  creditSaving: 1540.0,
  todayInterchange: 5301.54,
  todayMargin: 2000.0,
  grossCOA: 9401.54,
  annualMSF: 28000.0,
  surchargeRevenue: 0,
  netToday: 28000.0,
  octNet: 28000.0,
  plSwing: 0,
  todayScheme: 2100.0,
  oct2026Scheme: 2100.0,
  confidence: 'low',
  period: 'pre_reform',
};

const BASE_RAW: RawAssessmentData = {
  volume: 2_000_000,
  planType: 'flat',
  msfRate: 0.014,
  surcharging: false,
  surchargeRate: 0,
  surchargeNetworks: [],
  industry: 'retail',
  psp: 'Stripe',
  passThrough: 0,
  country: 'AU',
};

const BASE_CTX: ResolutionContext = { country: 'AU', industry: 'retail' };

describe('EscapeScenarioCard', () => {
  beforeEach(() => {
    calcCallCount = 0;
    vi.clearAllMocks();
  });

  it('hidden for category 1', () => {
    const { container } = render(
      <EscapeScenarioCard
        category={1}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('hidden for category 3', () => {
    const { container } = render(
      <EscapeScenarioCard
        category={3}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('visible for category 2 with new section eyebrow', () => {
    render(
      <EscapeScenarioCard
        category={2}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );
    expect(screen.getByText(/Is there a better option\?/i)).toBeInTheDocument();
  });

  it('visible for category 4', () => {
    render(
      <EscapeScenarioCard
        category={4}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Tyro"
      />,
    );
    expect(screen.getByText(/Is there a better option\?/i)).toBeInTheDocument();
  });

  it('costPlusOctNet calculated on mount (calculateMetrics called once)', () => {
    render(
      <EscapeScenarioCard
        category={2}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Single calc on mount for the cost-plus escape (twin-card range removed)
    expect(calcCallCount).toBe(1);
  });

  it('intro mentions itemised plan with PSP name inline', () => {
    render(
      <EscapeScenarioCard
        category={2}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    expect(
      screen.getByText(/Stripe also offers an itemised plan/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the reduction flows through automatically/i),
    ).toBeInTheDocument();
  });

  it('green box shows saving heading and amount', () => {
    render(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 28000 }}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Heading uses the PSP name inline
    expect(
      screen.getByText(/Switching to Stripe.s itemised plan saves you:/i),
    ).toBeInTheDocument();

    // Saving = |28000 - 7676.92| ≈ $20,323
    expect(screen.getByText('$20,323/year')).toBeInTheDocument();
  });

  it('body shows comparison and 100% pass-through note', () => {
    render(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 28000 }}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    expect(screen.getByText(/Your net cost would be/i)).toBeInTheDocument();
    expect(
      screen.getByText(/the full saving flows automatically at 100%/i),
    ).toBeInTheDocument();
  });

  it('PSP name appears inline, never "your PSP" or banned phrases', () => {
    render(
      <EscapeScenarioCard
        category={4}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Tyro"
      />,
    );

    expect(screen.getByText(/Tyro also offers an itemised plan/i)).toBeInTheDocument();

    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('your PSP');
    expect(allText).not.toContain('your provider');
    expect(allText).not.toContain('no negotiation needed');
  });
});
