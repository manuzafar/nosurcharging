import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhereIStandToday } from '@/components/results/sections/WhereIStandToday';
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

describe('WhereIStandToday', () => {
  it('renders header with PSP name', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs()}
        pspName="Stripe"
        volume={500_000}
        planType="flat"
        surcharging={true}
      />,
    );
    expect(screen.getByText('What you pay Stripe each year')).toBeInTheDocument();
  });

  it('renders three cost bars', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs()}
        pspName="Stripe"
        volume={500_000}
        planType="flat"
        surcharging={false}
      />,
    );
    expect(screen.getByText('Interchange (IC)')).toBeInTheDocument();
    expect(screen.getByText('Scheme fees')).toBeInTheDocument();
    expect(screen.getByText('PSP margin')).toBeInTheDocument();
  });

  it('displays dollar values with font-mono', () => {
    const { container } = render(
      <WhereIStandToday
        outputs={makeOutputs({ todayInterchange: 12_000, todayScheme: 2_100, todayMargin: 8_000 })}
        pspName="Stripe"
        volume={500_000}
        planType="flat"
        surcharging={false}
      />,
    );
    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThanOrEqual(3);
  });

  it('shows surcharge recovery for Cat 3/4 when surcharging', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs({ category: 3, surchargeRevenue: 5_000 })}
        pspName="Tyro"
        volume={400_000}
        planType="costplus"
        surcharging={true}
      />,
    );
    expect(screen.getByText('Surcharge recovery')).toBeInTheDocument();
    expect(screen.getByText('Net position')).toBeInTheDocument();
  });

  it('hides surcharge recovery for Cat 1/2', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs({ category: 1, surchargeRevenue: 0 })}
        pspName="Stripe"
        volume={500_000}
        planType="costplus"
        surcharging={false}
      />,
    );
    expect(screen.queryByText('Surcharge recovery')).not.toBeInTheDocument();
  });

  it('uses annualMSF for flat-rate plans', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs({ annualMSF: 28_000 })}
        pspName="Stripe"
        volume={500_000}
        planType="flat"
        surcharging={false}
      />,
    );
    expect(screen.getByText('$28,000')).toBeInTheDocument();
  });

  it('uses grossCOA for cost-plus plans', () => {
    render(
      <WhereIStandToday
        outputs={makeOutputs({ grossCOA: 25_000 })}
        pspName="Stripe"
        volume={500_000}
        planType="costplus"
        surcharging={false}
      />,
    );
    expect(screen.getByText('$25,000')).toBeInTheDocument();
  });
});
