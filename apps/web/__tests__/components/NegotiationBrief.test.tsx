import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NegotiationBrief } from '@/components/results/sections/NegotiationBrief';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

// CollapsibleSection persists open/closed state in localStorage. Clear it
// between tests so each `renderOpen` flip produces a deterministic toggle.
beforeEach(() => {
  window.localStorage.clear();
});

// NegotiationBrief is wrapped in CollapsibleSection (collapsed by default).
interface BriefProps {
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  volume: number;
  category: 1 | 2 | 3 | 4 | 5;
  outputs: AssessmentOutputs;
}
function renderOpen(props: BriefProps) {
  const result = render(<NegotiationBrief {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /negotiation brief/i }));
  return result;
}

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

describe('NegotiationBrief', () => {
  const defaultProps = {
    pspName: 'Stripe',
    planType: 'flat' as const,
    volume: 500_000,
    category: 2 as const,
    outputs: makeOutputs({ category: 2 }),
  };

  it('renders section with correct id', () => {
    const { container } = render(<NegotiationBrief {...defaultProps} />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('negotiate');
    expect(section?.dataset.section).toBe('negotiate');
  });

  it('renders PSP contact card', () => {
    renderOpen(defaultProps);
    expect(screen.getByText('Stripe contact')).toBeInTheDocument();
    expect(screen.getByText(/dashboard.stripe.com/)).toBeInTheDocument();
  });

  it('renders Tyro contact with phone number', () => {
    renderOpen({ ...defaultProps, pspName: 'Tyro' });
    expect(screen.getByText('Tyro contact')).toBeInTheDocument();
    expect(screen.getByText('1300 966 639')).toBeInTheDocument();
  });

  it('"Other" PSP shows generic instructions', () => {
    renderOpen({ ...defaultProps, pspName: 'SomePSP' });
    expect(screen.getByText('SomePSP contact')).toBeInTheDocument();
    expect(screen.getByText(/Contact your payment provider/)).toBeInTheDocument();
  });

  it('renders 5 numbered steps', () => {
    renderOpen(defaultProps);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('3.')).toBeInTheDocument();
    expect(screen.getByText('4.')).toBeInTheDocument();
    expect(screen.getByText('5.')).toBeInTheDocument();
  });

  it('script block interpolates volume and PSP name', () => {
    renderOpen({ ...defaultProps, volume: 1_000_000 });
    expect(screen.getByText(/\$1\.0m annually on a flat rate plan with Stripe/)).toBeInTheDocument();
  });

  it('renders alt PSP table', () => {
    renderOpen({ ...defaultProps, pspName: 'CommBank' });
    expect(screen.getByText(/If CommBank says no/)).toBeInTheDocument();
    // CommBank filtered out of table, so Stripe/Square/Tyro/Zeller shown
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('Square')).toBeInTheDocument();
  });

  it('alt PSP table excludes current PSP', () => {
    renderOpen({ ...defaultProps, pspName: 'Stripe' });
    // Table should not contain Stripe
    const rows = screen.getAllByRole('row');
    // Header + 3 data rows (Stripe excluded from 4 ALT_PSPS)
    expect(rows).toHaveLength(4);
  });
});
