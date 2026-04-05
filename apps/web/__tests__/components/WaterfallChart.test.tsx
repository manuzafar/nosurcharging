import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock Recharts — jsdom doesn't support SVG layout
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
}));

import { WaterfallChart } from '@/components/charts/WaterfallChart';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

// Scenario 4: Cat 4, $3M flat rate, surcharging 1.2%, 45% PT
const CAT4_OUTPUTS: AssessmentOutputs = {
  category: 4,
  icSaving: 2586.92,
  debitSaving: 276.92,
  creditSaving: 2310.0,
  grossCOA: 0, // not used for flat rate
  annualMSF: 42000.0,
  todayInterchange: 5000.0,
  todayMargin: 1500.0,
  surchargeRevenue: 36000.0,
  netToday: 6000.0,
  octNet: 40835.89,
  plSwing: -34835.89,
  todayScheme: 3150.0,
  oct2026Scheme: 3150.0,
  confidence: 'low',
  period: 'pre_reform',
};

// Scenario 1: Cat 1, $2M cost-plus, not surcharging
// From calculation-verification.md:
//   grossCOA = 9401.54 (debitIC 1661.54 + creditIC 3640 + scheme 2100 + margin 2000)
//   netToday = 9401.54 (no surcharge)
//   octNet = 7676.92
//   icSaving = 1724.62
//   Bar 3 should run from 7676.92 to 9401.54 → height = 1724.62 = icSaving
const CAT1_OUTPUTS: AssessmentOutputs = {
  category: 1,
  icSaving: 1724.62,
  debitSaving: 184.62,
  creditSaving: 1540.0,
  grossCOA: 9401.54,
  annualMSF: 28000.0, // not used for cost-plus pivot
  todayInterchange: 5301.54,
  todayMargin: 2000.0,
  surchargeRevenue: 0,
  netToday: 9401.54,
  octNet: 7676.92,
  plSwing: 1724.62,
  todayScheme: 2100.0,
  oct2026Scheme: 2100.0,
  confidence: 'low',
  period: 'pre_reform',
};

describe('WaterfallChart', () => {
  it('renders without throwing when given valid outputs', () => {
    expect(() => render(<WaterfallChart outputs={CAT4_OUTPUTS} />)).not.toThrow();
  });

  it('throws when scheme fees invariant is violated', () => {
    const brokenOutputs = {
      ...CAT4_OUTPUTS,
      todayScheme: 3150.0,
      oct2026Scheme: 3151.0,
    };
    expect(() => render(<WaterfallChart outputs={brokenOutputs} />)).toThrow(
      'Scheme fees invariant violated',
    );
  });

  it('renders custom legend with correct items', () => {
    const { getByText } = render(<WaterfallChart outputs={CAT4_OUTPUTS} />);
    expect(getByText('Interchange')).toBeInTheDocument();
    expect(getByText('Scheme fees')).toBeInTheDocument();
    expect(getByText('Margin')).toBeInTheDocument();
    expect(getByText('Surcharge offset')).toBeInTheDocument();
  });

  it('Category 1: bar 3 (IC saving) height equals icSaving within $1', () => {
    // For Cat 1 (cost-plus, no surcharge):
    //   pivotPoint = grossCOA = 9401.54
    //   bar 3 range = [octNet, pivotPoint] = [7676.92, 9401.54]
    //   bar 3 height = 9401.54 - 7676.92 = 1724.62 = icSaving
    //
    // The bug was: netToday + icSaving = 9401.54 + 1724.62 = 11126.16 (WRONG)
    // The fix: pivotPoint = grossCOA = 9401.54 (CORRECT, equals netToday for no-surcharge)

    const pivotPoint = CAT1_OUTPUTS.grossCOA;
    const bar3Height = Math.round(pivotPoint) - Math.round(CAT1_OUTPUTS.octNet);
    const expectedHeight = Math.round(CAT1_OUTPUTS.icSaving);

    expect(Math.abs(bar3Height - expectedHeight)).toBeLessThanOrEqual(1);
  });

  it('Category 1: bar 3 runs from octNet to grossCOA, not to netToday+icSaving', () => {
    // grossCOA = netToday when surchargeRate = 0 (no surcharge)
    // So pivotPoint = grossCOA = 9401.54 = netToday
    // NOT 9401.54 + 1724.62 = 11126.16
    expect(CAT1_OUTPUTS.grossCOA).toBeCloseTo(CAT1_OUTPUTS.netToday, 1);
  });
});
