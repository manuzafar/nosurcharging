import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the calculation pipeline
vi.mock('@nosurcharging/calculations/rules/resolver', () => ({
  resolveAssessmentInputs: vi.fn((...args: unknown[]) => args[0]),
}));

vi.mock('@nosurcharging/calculations/calculations', () => ({
  calculateMetrics: vi.fn(() => ({
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
    octNet: 27223.92,
    plSwing: 776.08,
    todayScheme: 2100.0,
    oct2026Scheme: 2100.0,
    confidence: 'low' as const,
    period: 'pre_reform' as const,
  })),
}));

import { PassThroughSlider } from '@/components/results/PassThroughSlider';
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

const BASE_CTX: ResolutionContext = {
  country: 'AU',
  industry: 'retail',
};

describe('PassThroughSlider', () => {
  const onOutputsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hidden for category 1', () => {
    const { container } = render(
      <PassThroughSlider
        category={1}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
        onOutputsChange={onOutputsChange}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('hidden for category 3', () => {
    const { container } = render(
      <PassThroughSlider
        category={3}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Square"
        onOutputsChange={onOutputsChange}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('visible for category 2', () => {
    render(
      <PassThroughSlider
        category={2}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
        onOutputsChange={onOutputsChange}
      />,
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('visible for category 4', () => {
    render(
      <PassThroughSlider
        category={4}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Tyro"
        onOutputsChange={onOutputsChange}
      />,
    );
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('PSP name appears in note text, not "your PSP"', () => {
    render(
      <PassThroughSlider
        category={2}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
        onOutputsChange={onOutputsChange}
      />,
    );

    // PSP name inline
    expect(screen.getByText(/Stripe keeps the full/)).toBeInTheDocument();
    expect(screen.getByText(/If Stripe passes through/)).toBeInTheDocument();

    // Never "your PSP"
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('your PSP');
  });

  it('onOutputsChange called on slider input', () => {
    render(
      <PassThroughSlider
        category={2}
        passThrough={0}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
        onOutputsChange={onOutputsChange}
      />,
    );

    const slider = screen.getByRole('slider');
    // Simulate native input event — jsdom doesn't support userEvent on range inputs
    Object.defineProperty(slider, 'value', { value: '45', writable: true });
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onOutputsChange).toHaveBeenCalled();
  });
});
