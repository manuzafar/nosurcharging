import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Recharts so the component renders deterministically in jsdom
vi.mock('recharts', () => ({
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`} />
  ),
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { CostCompositionChart } from '@/components/results/CostCompositionChart';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

const CAT1_OUTPUTS: AssessmentOutputs = {
  category: 1,
  icSaving: 1_725,
  debitSaving: 185,
  creditSaving: 1_540,
  todayInterchange: 5_300,
  todayMargin: 2_000,
  grossCOA: 9_400,
  annualMSF: 0,
  surchargeRevenue: 0,
  netToday: 9_400,
  octNet: 7_675,
  plSwing: 1_725,
  plSwingLow: 1_725,
  plSwingHigh: 1_725,
  rangeDriver: 'card_mix' as const,
  rangeNote: '',
  todayScheme: 2_100,
  oct2026Scheme: 2_100,
  confidence: 'low',
  period: 'pre_reform',
};

const CAT4_OUTPUTS: AssessmentOutputs = {
  category: 4,
  icSaving: 2_587,
  debitSaving: 277,
  creditSaving: 2_310,
  todayInterchange: 5_000,
  todayMargin: 1_500,
  grossCOA: 9_650,
  annualMSF: 28_000,
  surchargeRevenue: 7_500,
  netToday: 20_500,
  octNet: 26_837,
  plSwing: -6_337,
  plSwingLow: -6_337,
  plSwingHigh: -6_337,
  rangeDriver: 'card_mix' as const,
  rangeNote: '',
  todayScheme: 3_150,
  oct2026Scheme: 3_150,
  confidence: 'low',
  period: 'pre_reform',
};

describe('CostCompositionChart', () => {
  it('renders without throwing for cost-plus outputs', () => {
    expect(() =>
      render(
        <CostCompositionChart
          outputs={CAT1_OUTPUTS}
          passThrough={0}
          pspName="Tyro"
        />,
      ),
    ).not.toThrow();
  });

  it('throws when scheme fees invariant is violated', () => {
    const broken = { ...CAT1_OUTPUTS, oct2026Scheme: 2_101 };
    expect(() =>
      render(
        <CostCompositionChart
          outputs={broken}
          passThrough={0}
          pspName="Tyro"
        />,
      ),
    ).toThrow('Scheme fees invariant violated');
  });

  it('section eyebrow uses pspName', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Tyro"
      />,
    );
    expect(screen.getByText(/What makes up your Tyro bill/i)).toBeInTheDocument();
  });

  it('intro text mentions pspName twice (margin reference)', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Stripe"
      />,
    );
    const text = document.body.textContent ?? '';
    // Once in eyebrow, once in intro, once in legend, once in insight = 4+
    const matches = text.match(/Stripe/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('scheme fees segment heights are equal in both columns', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Tyro"
      />,
    );
    const chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ scheme: number }>;
    expect(chartData[0]!.scheme).toBe(chartData[1]!.scheme);
  });

  it('cost-plus has no "Other" segment', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Tyro"
      />,
    );
    const chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ other: number }>;
    expect(chartData[0]!.other).toBe(0);
    expect(chartData[1]!.other).toBe(0);
    // Bar element for "other" should not be present for cost-plus
    expect(screen.queryByTestId('bar-other')).not.toBeInTheDocument();
  });

  it('flat rate has an "Other" segment + Estimated breakdown pill', () => {
    render(
      <CostCompositionChart
        outputs={CAT4_OUTPUTS}
        passThrough={0.5}
        pspName="Stripe"
      />,
    );
    const chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ other: number }>;
    // Other = annualMSF - interchange - scheme - margin = 28000 - 5000 - 3150 - 1500 = 18350
    expect(chartData[0]!.other).toBeGreaterThan(0);
    expect(screen.getByTestId('bar-other')).toBeInTheDocument();
    expect(screen.getByText(/Estimated breakdown/i)).toBeInTheDocument();
  });

  it('insight note for cost-plus mentions interchange %', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Tyro"
      />,
    );
    // 5300 / 9400 ≈ 56%
    expect(screen.getByText(/Interchange is 56% of your Tyro bill/i)).toBeInTheDocument();
  });

  it('insight note for flat rate mentions estimated bundling', () => {
    render(
      <CostCompositionChart
        outputs={CAT4_OUTPUTS}
        passThrough={0}
        pspName="Stripe"
      />,
    );
    expect(
      screen.getByText(/This breakdown is estimated/i),
    ).toBeInTheDocument();
  });

  it('October interchange is reduced by IC saving for cost-plus', () => {
    render(
      <CostCompositionChart
        outputs={CAT1_OUTPUTS}
        passThrough={0}
        pspName="Tyro"
      />,
    );
    const chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ interchange: number }>;
    expect(chartData[1]!.interchange).toBeLessThan(chartData[0]!.interchange);
    // Cost-plus → full IC saving applied: 5300 - 1725 = 3575
    expect(chartData[1]!.interchange).toBe(3_575);
  });

  it('October interchange uses fractional IC saving for flat rate', () => {
    render(
      <CostCompositionChart
        outputs={CAT4_OUTPUTS}
        passThrough={0.5}
        pspName="Stripe"
      />,
    );
    const chartData = JSON.parse(
      screen.getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ interchange: number }>;
    // 50% pass-through: half of 2587 = 1294 (rounded), 5000 - 1294 = 3706
    expect(chartData[1]!.interchange).toBeGreaterThan(0);
    expect(chartData[1]!.interchange).toBeLessThan(chartData[0]!.interchange);
  });
});
