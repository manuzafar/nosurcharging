import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CostBreakdownChart } from '@/components/charts/CostBreakdownChart';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

const CAT1_OUTPUTS: AssessmentOutputs = {
  category: 1,
  icSaving: 1724.62,
  debitSaving: 184.62,
  creditSaving: 1540.0,
  todayInterchange: 5301.54,
  todayMargin: 2000.0,
  grossCOA: 9401.54,
  annualMSF: 28000.0,
  surchargeRevenue: 0,
  netToday: 9401.54,
  octNet: 7676.92,
  plSwing: 1724.62,
  todayScheme: 2100.0,
  oct2026Scheme: 2100.0,
  confidence: 'low',
  period: 'pre_reform',
};

const CAT4_OUTPUTS: AssessmentOutputs = {
  category: 4,
  icSaving: 2586.92,
  debitSaving: 276.92,
  creditSaving: 2310.0,
  todayInterchange: 5000.0,
  todayMargin: 1500.0,
  grossCOA: 9650.0,
  annualMSF: 42000.0,
  surchargeRevenue: 36000.0,
  netToday: 6000.0,
  octNet: 40835.89,
  plSwing: -34835.89,
  todayScheme: 3150.0,
  oct2026Scheme: 3150.0,
  confidence: 'low',
  period: 'pre_reform',
};

describe('CostBreakdownChart', () => {
  it('renders without throwing for valid outputs', () => {
    expect(() =>
      render(<CostBreakdownChart outputs={CAT1_OUTPUTS} passThrough={0} />),
    ).not.toThrow();
  });

  it('throws when scheme fees invariant is violated', () => {
    const broken = { ...CAT1_OUTPUTS, oct2026Scheme: 2101.0 };
    expect(() =>
      render(<CostBreakdownChart outputs={broken} passThrough={0} />),
    ).toThrow('Scheme fees invariant violated');
  });

  it('scheme fees segment heights are equal in both columns', () => {
    const { getByTestId } = render(
      <CostBreakdownChart outputs={CAT1_OUTPUTS} passThrough={0} />,
    );

    const chartData = JSON.parse(
      getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ scheme: number }>;

    const todayScheme = chartData[0]!.scheme;
    const octScheme = chartData[1]!.scheme;
    expect(todayScheme).toBe(octScheme);
  });

  it('scheme fees equal for Cat 4 outputs too', () => {
    const { getByTestId } = render(
      <CostBreakdownChart outputs={CAT4_OUTPUTS} passThrough={0.45} />,
    );

    const chartData = JSON.parse(
      getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ scheme: number }>;

    expect(chartData[0]!.scheme).toBe(chartData[1]!.scheme);
  });

  it('surcharge offset is zero for categories without surcharging', () => {
    const { getByTestId } = render(
      <CostBreakdownChart outputs={CAT1_OUTPUTS} passThrough={0} />,
    );

    const chartData = JSON.parse(
      getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ surcharge: number }>;

    expect(chartData[0]!.surcharge).toBe(0);
    expect(chartData[1]!.surcharge).toBe(0);
  });

  it('surcharge offset is negative in Today column for surcharging merchants', () => {
    const { getByTestId } = render(
      <CostBreakdownChart outputs={CAT4_OUTPUTS} passThrough={0.45} />,
    );

    const chartData = JSON.parse(
      getByTestId('bar-chart').getAttribute('data-chart-data')!,
    ) as Array<{ surcharge: number }>;

    expect(chartData[0]!.surcharge).toBeLessThan(0);
    expect(chartData[1]!.surcharge).toBe(0); // gone after reform
  });

  it('renders custom legend', () => {
    const { getByText } = render(
      <CostBreakdownChart outputs={CAT1_OUTPUTS} passThrough={0} />,
    );
    expect(getByText('Interchange')).toBeInTheDocument();
    expect(getByText('Scheme fees')).toBeInTheDocument();
    expect(getByText('Margin')).toBeInTheDocument();
    expect(getByText('Surcharge offset')).toBeInTheDocument();
  });
});
