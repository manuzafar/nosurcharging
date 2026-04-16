import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';

const FLAT_OUTPUTS: AssessmentOutputs = {
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
  octNet: 25_900,
  plSwing: -5_400,
  plSwingLow: -5_400,
  plSwingHigh: -5_400,
  rangeDriver: 'card_mix' as const,
  rangeNote: '',
  todayScheme: 2_100,
  oct2026Scheme: 2_100,
  confidence: 'low',
  period: 'pre_reform',
};

const COSTPLUS_OUTPUTS: AssessmentOutputs = {
  ...FLAT_OUTPUTS,
  category: 1,
  surchargeRevenue: 0,
  netToday: 25_000,
  octNet: 20_800,
  plSwing: 4_200,
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

const FLAT_PROPS = {
  outputs: FLAT_OUTPUTS,
  passThrough: 0.5,
  resolutionTrace: MOCK_TRACE,
  volume: 500_000,
  pspName: 'Stripe',
  planType: 'flat' as const,
  msfRate: 0.014,
  surcharging: true,
  surchargeRate: 0.015,
};

const COSTPLUS_PROPS = {
  ...FLAT_PROPS,
  outputs: COSTPLUS_OUTPUTS,
  planType: 'costplus' as const,
  msfRate: 0,
  surcharging: false,
  surchargeRate: 0,
};

describe('AssumptionsPanel', () => {
  const user = userEvent.setup();

  it('toggle uses the new wording', () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    expect(
      screen.getByText(/Show me exactly how this is calculated/i),
    ).toBeInTheDocument();
  });

  it('is collapsed by default — toggle shows ↓', () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    expect(
      screen.getByText(/↓ Show me exactly how this is calculated/),
    ).toBeInTheDocument();
  });

  it('does NOT embed the cost composition chart', () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    // The CostCompositionChart owns this testid; AssumptionsPanel must not.
    expect(screen.queryByTestId('cost-composition-chart')).not.toBeInTheDocument();
  });

  it('shows formula rows for flat-rate when expanded', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));

    // Flat rate first row
    expect(screen.getByText(/What you pay Stripe today/i)).toBeInTheDocument();
    expect(screen.getByText(/\$500,000 × 1\.40% flat rate/)).toBeInTheDocument();
    expect(screen.getByText('$28,000')).toBeInTheDocument();

    // Surcharge row
    expect(screen.getByText(/Surcharge you currently recover/i)).toBeInTheDocument();
    expect(screen.getByText('-$7,500')).toBeInTheDocument();

    // Pass-through row
    expect(screen.getByText(/Pass-through to your rate/i)).toBeInTheDocument();
    expect(screen.getByText(/50% of total IC saving/)).toBeInTheDocument();
  });

  it('shows formula rows for cost-plus when expanded — no surcharge row, no pass-through row', async () => {
    render(<AssumptionsPanel {...COSTPLUS_PROPS} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));

    expect(screen.getByText(/What you pay today/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Interchange \+ scheme fees \+ margin/i),
    ).toBeInTheDocument();

    // No surcharge row when not surcharging
    expect(
      screen.queryByText(/Surcharge you currently recover/i),
    ).not.toBeInTheDocument();
    // No pass-through row for cost-plus
    expect(screen.queryByText(/Pass-through to your rate/i)).not.toBeInTheDocument();
  });

  it('shows the inline italic scheme-fees note', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.getByText(/Visa and Mastercard charge a separate network fee/i),
    ).toBeInTheDocument();
  });

  it('still shows card mix rows from resolutionTrace', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));

    expect(screen.getByText('Visa debit')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('eftpos')).toBeInTheDocument();
    expect(screen.getByText('8%')).toBeInTheDocument();

    const rbaLabels = screen.getAllByText(/← RBA average/);
    expect(rbaLabels.length).toBeGreaterThanOrEqual(5);

    const yourInputLabels = screen.getAllByText(/← Your input/);
    expect(yourInputLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows nothing for card mix when resolutionTrace is empty', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} resolutionTrace={{}} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));

    expect(screen.queryByText('Visa debit')).not.toBeInTheDocument();
    expect(screen.queryByText('35%')).not.toBeInTheDocument();
  });

  it('shows RBA source citation when expanded', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.getByText(/RBA Statistical Tables C1 and C2/),
    ).toBeInTheDocument();
  });

  // ── Sprint 3 — commercial card share + surcharge conservative note ──

  it('shows commercial-share copy when commercial is 0 and default', async () => {
    const trace: ResolutionTrace = {
      ...MOCK_TRACE,
      'cardMix.commercial': { source: 'regulatory_constant', value: 0, label: 'RBA average' },
    };
    render(<AssumptionsPanel {...FLAT_PROPS} resolutionTrace={trace} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.getByText(/Commercial card share assumed 0%/i),
    ).toBeInTheDocument();
  });

  it('hides commercial-share copy when merchant supplied a non-zero share', async () => {
    const trace: ResolutionTrace = {
      ...MOCK_TRACE,
      'cardMix.commercial': { source: 'merchant_input', value: 0.2, label: 'Your input' },
    };
    render(<AssumptionsPanel {...FLAT_PROPS} resolutionTrace={trace} />);
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.queryByText(/Commercial card share assumed 0%/i),
    ).not.toBeInTheDocument();
  });

  it('shows surcharge conservative note for Cat 4 (flat + surcharging)', async () => {
    render(<AssumptionsPanel {...FLAT_PROPS} />); // Cat 4
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.getByText(/Your result is therefore a conservative estimate/i),
    ).toBeInTheDocument();
  });

  it('hides surcharge conservative note for Cat 1 / Cat 2', async () => {
    render(<AssumptionsPanel {...COSTPLUS_PROPS} />); // Cat 1
    await user.click(screen.getByText(/Show me exactly how this is calculated/i));
    expect(
      screen.queryByText(/Your result is therefore a conservative estimate/i),
    ).not.toBeInTheDocument();
  });
});
