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
    // Return different octNet based on planType and passThrough
    if (resolved.planType === 'costplus') {
      return { octNet: COST_PLUS_OCT_NET };
    }
    // Flat rate: octNet depends on passThrough
    const baseOctNet = resolved.passThrough === 0 ? 42000 : resolved.passThrough === 1 ? 26275.38 : 40000;
    return { octNet: baseOctNet };
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

  it('visible for category 2', () => {
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
    expect(screen.getByText('Your current plan')).toBeInTheDocument();
    expect(screen.getByText('Escape scenario')).toBeInTheDocument();
  });

  it('costPlusOctNet calculated on mount (calculateMetrics called)', () => {
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

    // calculateMetrics called for: costPlus escape (1), range at 0% (1), range at 100% (1) = 3 calls on mount
    expect(calcCallCount).toBe(3);
  });

  it('left card value updates when passThrough prop changes', () => {
    const { rerender } = render(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 28000 }}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Left card shows octNet at 0% PT
    expect(screen.getByText('$28,000')).toBeInTheDocument();

    // Rerender with different passThrough — left card value changes
    rerender(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 27223 }}
        passThrough={0.45}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    expect(screen.getByText('$27,223')).toBeInTheDocument();
  });

  it('right card value does NOT change when passThrough changes', () => {
    const { rerender } = render(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 28000 }}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Right card shows costPlusOctNet — fixed
    const costPlusFormatted = '$' + Math.abs(Math.round(COST_PLUS_OCT_NET)).toLocaleString('en-AU');
    expect(screen.getByText(costPlusFormatted)).toBeInTheDocument();

    // Rerender with different passThrough
    rerender(
      <EscapeScenarioCard
        category={2}
        outputs={{ ...BASE_OUTPUTS, octNet: 27223 }}
        passThrough={0.45}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Right card value unchanged
    expect(screen.getByText(costPlusFormatted)).toBeInTheDocument();
  });

  it('right card has featured border (1.5px success)', () => {
    const { container } = render(
      <EscapeScenarioCard
        category={2}
        outputs={BASE_OUTPUTS}
        passThrough={0}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
      />,
    );

    // Find the escape scenario card — it has the green badge
    const escapeCard = screen.getByText('Escape scenario').closest('div[class*="rounded"]');
    expect(escapeCard).toBeTruthy();
    expect(escapeCard!.getAttribute('style')).toContain('1.5px');
  });

  it('PSP name appears inline, not "your PSP"', () => {
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

    expect(screen.getByText(/your volume and Tyro/)).toBeInTheDocument();
    // Check the exact phrase "your PSP" doesn't appear anywhere
    const allText = document.body.textContent ?? '';
    expect(/your PSP/i.test(allText)).toBe(false);
  });
});
