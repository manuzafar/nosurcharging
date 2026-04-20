import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhatsChanging } from '@/components/results/sections/WhatsChanging';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

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

describe('WhatsChanging', () => {
  it('renders CERTAIN and DEPENDS labels', () => {
    render(<WhatsChanging category={4} outputs={makeOutputs()} pspName="Stripe" />);
    expect(screen.getByText('Certain')).toBeInTheDocument();
    expect(screen.getByText('Depends')).toBeInTheDocument();
  });

  it('shows surcharge revenue loss for Cat 3/4', () => {
    render(<WhatsChanging category={3} outputs={makeOutputs({ surchargeRevenue: 5_000 })} pspName="Tyro" />);
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
    expect(screen.getByText('annual surcharge revenue lost')).toBeInTheDocument();
  });

  it('shows not applicable for Cat 1/2', () => {
    render(<WhatsChanging category={1} outputs={makeOutputs()} pspName="Stripe" />);
    expect(screen.getByText(/Not applicable/)).toBeInTheDocument();
  });

  it('shows IC saving in DEPENDS card', () => {
    render(<WhatsChanging category={2} outputs={makeOutputs({ icSaving: 3_000 })} pspName="Square" />);
    expect(screen.getByText('$3,000')).toBeInTheDocument();
    expect(screen.getByText('potential annual IC saving')).toBeInTheDocument();
  });

  it('renders PSP name in depends body for Cat 2', () => {
    render(<WhatsChanging category={2} outputs={makeOutputs()} pspName="Square" />);
    expect(screen.getByText(/Square keeps the IC saving/)).toBeInTheDocument();
  });

  it('renders PSP name in depends body for Cat 1', () => {
    render(<WhatsChanging category={1} outputs={makeOutputs()} pspName="Stripe" />);
    expect(screen.getByText(/Stripe passes through/)).toBeInTheDocument();
  });

  it('renders "not changing" strip', () => {
    render(<WhatsChanging category={1} outputs={makeOutputs()} pspName="Stripe" />);
    expect(screen.getByText(/Amex, BNPL, and PayPal remain surchargeable/)).toBeInTheDocument();
  });

  it('font-mono on financial numbers', () => {
    const { container } = render(<WhatsChanging category={3} outputs={makeOutputs()} pspName="Stripe" />);
    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThanOrEqual(2);
  });
});
