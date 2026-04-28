import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MetricCards } from '@/components/results/MetricCards';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

function makeOutputs(overrides: Partial<AssessmentOutputs> = {}): AssessmentOutputs {
  return {
    category: 1,
    icSaving: 1_350,
    debitSaving: 160,
    creditSaving: 1_190,
    todayInterchange: 5_300,
    todayMargin: 2_000,
    grossCOA: 9_400,
    annualMSF: 28_000,
    surchargeRevenue: 0,
    netToday: 9_400,
    octNet: 8_050,
    plSwing: 1_350,
    plSwingLow: 1_080,
    plSwingHigh: 1_620,
    rangeDriver: 'card_mix' as const,
    rangeNote: '',
    todayScheme: 2_100,
    oct2026Scheme: 2_100,
    confidence: 'low',
    period: 'pre_reform',
    ...overrides,
  };
}

describe('MetricCards', () => {
  describe('Standard Cat 1-4 cells', () => {
    it('renders Interchange saving / Net P&L impact / Surcharge revenue / Cost today for Cat 1', () => {
      render(<MetricCards outputs={makeOutputs()} planType="costplus" />);
      expect(screen.getByText(/Interchange saving/i)).toBeInTheDocument();
      expect(screen.getByText(/Net P&L impact/i)).toBeInTheDocument();
      expect(screen.getByText(/Surcharge revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/Your cost today/i)).toBeInTheDocument();
    });

    it('shows IC saving value formatted as $1,350', () => {
      render(<MetricCards outputs={makeOutputs()} planType="costplus" />);
      expect(screen.getByText('$1,350')).toBeInTheDocument();
    });
  });

  describe('Category 5 — zero-cost EFTPOS', () => {
    function cat5Outputs() {
      return makeOutputs({
        category: 5,
        netToday: 0,
        octNet: 8_400,
        plSwing: -8_400,
        plSwingLow: -9_600,
        plSwingHigh: -7_200,
        rangeDriver: 'post_reform_rate',
        estimatedMSFRate: 0.014,
      });
    }

    it('renders the Cat 5 cell set: cost today / annual cost from October / rate / volume', () => {
      render(
        <MetricCards
          outputs={cat5Outputs()}
          planType="zero_cost"
          volume={600_000}
        />,
      );
      expect(screen.getByText(/Your cost today/i)).toBeInTheDocument();
      expect(screen.getByText(/Annual cost from October/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimated card rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Card volume/i)).toBeInTheDocument();
    });

    it('does NOT render the Interchange saving card for Cat 5', () => {
      // The IC saving accrues to the PSP during the plan transition, not the
      // merchant — showing it next to a negative plSwing would confuse the
      // narrative. It's still in AssumptionsPanel for transparency.
      render(
        <MetricCards
          outputs={cat5Outputs()}
          planType="zero_cost"
          volume={600_000}
        />,
      );
      expect(screen.queryByText(/Interchange saving/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Net P&L impact/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Surcharge revenue/i)).not.toBeInTheDocument();
    });

    it('shows $0 for cost today and $8,400 for annual cost from October', () => {
      render(
        <MetricCards
          outputs={cat5Outputs()}
          planType="zero_cost"
          volume={600_000}
        />,
      );
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$8,400')).toBeInTheDocument();
    });

    it('formats the estimated rate as 1.4% and volume as $600K', () => {
      render(
        <MetricCards
          outputs={cat5Outputs()}
          planType="zero_cost"
          volume={600_000}
        />,
      );
      expect(screen.getByText('1.4%')).toBeInTheDocument();
      expect(screen.getByText('$600K')).toBeInTheDocument();
    });

    it('uses category override even if planType prop is missing', () => {
      // Defensive — outputs.category===5 should be enough to route to Cat 5 cells
      render(<MetricCards outputs={cat5Outputs()} volume={600_000} />);
      expect(screen.getByText(/Annual cost from October/i)).toBeInTheDocument();
      expect(screen.queryByText(/Interchange saving/i)).not.toBeInTheDocument();
    });
  });
});
