import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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

  it('visible for category 2 with new section eyebrow', () => {
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
    expect(screen.getByText(/Model your outcome/i)).toBeInTheDocument();
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

  it('intro mentions IC saving amount and PSP name', () => {
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

    // Intro: "$1,725 processing cost reduction is reflected in your Stripe rate"
    expect(
      screen.getByText(/processing cost reduction is reflected in your Stripe rate/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$1,725/)).toBeInTheDocument();
  });

  it('slider labels use new spec wording', () => {
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

    expect(screen.getByText(/Not reflected in your rate \(0%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Fully reflected \(100%\)/)).toBeInTheDocument();
  });

  it('result box shows three rows with PSP name inline', () => {
    render(
      <PassThroughSlider
        category={2}
        passThrough={0.5}
        outputs={BASE_OUTPUTS}
        originalRaw={BASE_RAW}
        resolutionContext={BASE_CTX}
        pspName="Stripe"
        onOutputsChange={onOutputsChange}
      />,
    );

    expect(screen.getByText(/Cost reduction in your Stripe rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Your net annual impact/i)).toBeInTheDocument();
    expect(screen.getByText(/Net cost from October/i)).toBeInTheDocument();
  });

  it('never uses banned phrases ("your PSP", "your provider", "Stripe keeps")', () => {
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

    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('your PSP');
    expect(allText).not.toContain('your provider');
    expect(allText).not.toContain('Stripe keeps');
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
