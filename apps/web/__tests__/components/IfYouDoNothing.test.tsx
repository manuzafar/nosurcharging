import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IfYouDoNothing } from '@/components/results/sections/IfYouDoNothing';
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

describe('IfYouDoNothing', () => {
  it('Cat 1 shows reassurance message', () => {
    render(<IfYouDoNothing category={1} outputs={makeOutputs()} pspName="Stripe" />);
    expect(screen.getByText(/IC savings flow automatically/)).toBeInTheDocument();
  });

  it('Cat 2 shows opportunity cost message', () => {
    render(<IfYouDoNothing category={2} outputs={makeOutputs()} pspName="Square" />);
    expect(screen.getByText(/Square keeps it unless you negotiate/)).toBeInTheDocument();
  });

  it('Cat 3/4 renders 4 escalating cost cells', () => {
    render(<IfYouDoNothing category={4} outputs={makeOutputs({ plSwing: -7_500 })} pspName="Stripe" />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Annual')).toBeInTheDocument();
  });

  it('Cat 3/4 math is consistent', () => {
    render(<IfYouDoNothing category={3} outputs={makeOutputs({ plSwing: -3_650 })} pspName="Stripe" />);
    // Daily: 3650/365 = 10, Weekly: 3650/52 = 70, Monthly: 3650/12 = 304
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$70')).toBeInTheDocument();
    expect(screen.getByText('$304')).toBeInTheDocument();
    expect(screen.getByText('$3,650')).toBeInTheDocument();
  });

  it('Cat 3/4 shows asymmetry callout with PSP name', () => {
    render(<IfYouDoNothing category={4} outputs={makeOutputs()} pspName="Tyro" />);
    expect(screen.getByText(/Tyro has no obligation/)).toBeInTheDocument();
  });

  it('uses font-mono for cost numbers', () => {
    const { container } = render(<IfYouDoNothing category={4} outputs={makeOutputs()} pspName="Stripe" />);
    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThanOrEqual(4);
  });
});
