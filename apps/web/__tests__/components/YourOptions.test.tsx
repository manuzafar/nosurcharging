import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YourOptions } from '@/components/results/sections/YourOptions';
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

describe('YourOptions', () => {
  const defaultProps = {
    category: 4 as const,
    outputs: makeOutputs(),
    passThrough: 0.45,
    volume: 500_000,
    surcharging: true,
    pspName: 'Stripe',
  };

  it('returns null for Cat 1', () => {
    const { container } = render(<YourOptions {...defaultProps} category={1} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for Cat 2', () => {
    const { container } = render(<YourOptions {...defaultProps} category={2} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders scenario cards for Cat 3', () => {
    render(<YourOptions {...defaultProps} category={3} />);
    expect(screen.getByText('Do nothing')).toBeInTheDocument();
    expect(screen.getByText('Reprice 1.0%')).toBeInTheDocument();
    expect(screen.getByText('Reprice 1.5%')).toBeInTheDocument();
  });

  it('does NOT render a "Recommended" badge on any reference card', () => {
    // 1.5% repricing was previously labelled "Recommended" — that was a
    // prescription without knowing the merchant's gross margin or
    // competitive position, AND 1.5% is not the break-even.
    render(<YourOptions {...defaultProps} />);
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();
  });

  it('renders the section heading reframed as a conditional', () => {
    render(<YourOptions {...defaultProps} />);
    expect(
      screen.getByText(/If you choose to reprice/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Repricing is one of three ways to respond/i),
    ).toBeInTheDocument();
  });

  it('renders a Break-even card with the correct percentage', () => {
    // plSwing -7500, volume 500_000 → break-even 1.50%
    render(<YourOptions {...defaultProps} />);
    expect(screen.getByText(/Break-even \(1\.50%\)/)).toBeInTheDocument();
    expect(screen.getByText('Break-even')).toBeInTheDocument();
  });

  it('renders the break-even marker on the slider tick row', () => {
    render(<YourOptions {...defaultProps} />);
    const marker = screen.getByTestId('break-even-marker');
    expect(marker).toBeInTheDocument();
    expect(marker.textContent).toContain('1.50%');
  });

  it('renders the absorption-from-margin note below the slider', () => {
    render(<YourOptions {...defaultProps} />);
    expect(
      screen.getByText(/If your gross margin is above 25%/i),
    ).toBeInTheDocument();
  });

  it('renders custom slider', () => {
    render(<YourOptions {...defaultProps} />);
    expect(screen.getByLabelText('Custom repricing percentage')).toBeInTheDocument();
  });

  it('slider updates displayed percentage', () => {
    render(<YourOptions {...defaultProps} />);
    const slider = screen.getByLabelText('Custom repricing percentage');
    fireEvent.change(slider, { target: { value: '2.0' } });
    // Display now uses 2dp (1dp biases towards over-recovery)
    expect(screen.getByText('2.00%')).toBeInTheDocument();
  });

  it('uses font-mono for financial numbers', () => {
    const { container } = render(<YourOptions {...defaultProps} />);
    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThanOrEqual(4);
  });

  it('scenario math is correct — do nothing at 0%', () => {
    // net = 0 - 7500 + (4200 * 0.45) = -5610
    render(<YourOptions {...defaultProps} />);
    expect(screen.getByText('−$5,610')).toBeInTheDocument();
  });
});
