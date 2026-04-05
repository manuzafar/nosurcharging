import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Recharts for CostBreakdownChart inside AssumptionsPanel
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';

const MOCK_OUTPUTS: AssessmentOutputs = {
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

const MOCK_TRACE: ResolutionTrace = {
  'cardMix.visa_debit': { source: 'regulatory_constant', value: 0.35, label: 'RBA average' },
  'cardMix.visa_credit': { source: 'regulatory_constant', value: 0.18, label: 'RBA average' },
  'cardMix.mastercard_debit': { source: 'regulatory_constant', value: 0.17, label: 'RBA average' },
  'cardMix.mastercard_credit': { source: 'regulatory_constant', value: 0.12, label: 'RBA average' },
  'cardMix.eftpos': { source: 'regulatory_constant', value: 0.08, label: 'RBA average' },
  'cardMix.amex': { source: 'merchant_input', value: 0.05, label: 'Your input' },
  'cardMix.foreign': { source: 'regulatory_constant', value: 0.05, label: 'RBA average' },
  'expertRates.debitCents': { source: 'regulatory_constant', value: 9, label: 'RBA average' },
  'expertRates.creditPct': { source: 'regulatory_constant', value: 0.52, label: 'RBA average' },
};

describe('AssumptionsPanel', () => {
  const user = userEvent.setup();

  it('shows card mix rows with source labels when expanded', async () => {
    render(
      <AssumptionsPanel
        outputs={MOCK_OUTPUTS}
        passThrough={0}
        resolutionTrace={MOCK_TRACE}
      />,
    );

    // Expand the panel
    await user.click(screen.getByText(/how we calculated this/i));

    // Card mix rows should render with percentages and source labels
    expect(screen.getByText('Visa debit')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('eftpos')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();

    // Source labels from trace
    const rbaLabels = screen.getAllByText(/← RBA average/);
    expect(rbaLabels.length).toBeGreaterThanOrEqual(5);

    const yourInputLabels = screen.getAllByText(/← Your input/);
    expect(yourInputLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows nothing when resolutionTrace is empty', async () => {
    render(
      <AssumptionsPanel
        outputs={MOCK_OUTPUTS}
        passThrough={0}
        resolutionTrace={{}}
      />,
    );

    await user.click(screen.getByText(/how we calculated this/i));

    // Card mix rows should NOT render (trace entries return null)
    expect(screen.queryByText('Visa debit')).not.toBeInTheDocument();
    expect(screen.queryByText('35%')).not.toBeInTheDocument();
  });

  it('is collapsed by default', () => {
    render(
      <AssumptionsPanel
        outputs={MOCK_OUTPUTS}
        passThrough={0}
        resolutionTrace={MOCK_TRACE}
      />,
    );

    // Toggle shows expand arrow
    expect(screen.getByText(/↓ How we calculated this/)).toBeInTheDocument();
  });

  it('shows RBA source citation when expanded', async () => {
    render(
      <AssumptionsPanel
        outputs={MOCK_OUTPUTS}
        passThrough={0}
        resolutionTrace={MOCK_TRACE}
      />,
    );

    await user.click(screen.getByText(/how we calculated this/i));
    expect(screen.getByText(/RBA Statistical Tables C1 and C2/)).toBeInTheDocument();
  });
});
