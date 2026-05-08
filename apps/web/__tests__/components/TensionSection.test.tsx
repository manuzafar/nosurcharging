import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { TensionSection } from '@/components/results/sections/TensionSection';
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
    plSwing: -33_818,
    plSwingLow: -33_818,
    plSwingHigh: -33_818,
    rangeDriver: 'card_mix' as const,
    rangeNote: '',
    todayScheme: 2_100,
    oct2026Scheme: 2_100,
    confidence: 'low',
    period: 'pre_reform',
    ...overrides,
  };
}

describe('TensionSection', () => {
  it('renders nothing for Cat 1', () => {
    const { container } = render(
      <TensionSection category={1} pspName="Stripe" outputs={makeOutputs({ category: 1 })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for Cat 2', () => {
    const { container } = render(
      <TensionSection category={2} pspName="Stripe" outputs={makeOutputs({ category: 2 })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('Cat 3 renders header + body + 3 tension items', () => {
    render(
      <TensionSection category={3} pspName="Tyro" outputs={makeOutputs({ category: 3 })} />,
    );
    expect(
      screen.getByText(/Here is what this number does not tell you/),
    ).toBeInTheDocument();
    // Body interpolates the formatted exposure
    expect(screen.getByText(/\$33,818 is an estimate based on market averages/)).toBeInTheDocument();
    // Three tension item leads
    expect(screen.getByText(/passes through less than 45%/i)).toBeInTheDocument();
    expect(screen.getByText(/skews toward credit or corporate/i)).toBeInTheDocument();
    expect(screen.getByText(/There is still a negotiation window/i)).toBeInTheDocument();
  });

  it('Cat 4 interpolates PSP name into both body and items', () => {
    render(
      <TensionSection category={4} pspName="Stripe" outputs={makeOutputs({ category: 4 })} />,
    );
    const text = document.body.textContent ?? '';
    expect(text).toContain('Stripe');
    // No banned phrasing
    expect(text).not.toMatch(/your PSP/i);
  });

  it('Cat 5 renders body referencing the post-reform rate, no items', () => {
    render(
      <TensionSection
        category={5}
        pspName="Square"
        outputs={makeOutputs({ category: 5, plSwing: -42_000 })}
      />,
    );
    expect(screen.getByText(/1\.4% market rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Square moves you to/i)).toBeInTheDocument();
    // Cat 5 has no enumerated tension items — only body
    expect(screen.queryByText(/passes through less than 45%/i)).not.toBeInTheDocument();
  });

  it('renders the amber warning icon (Lucide TriangleAlert SVG)', () => {
    const { container } = render(
      <TensionSection category={4} pspName="Stripe" outputs={makeOutputs({ category: 4 })} />,
    );
    // The amber warning circle now wraps a Lucide TriangleAlert <svg>.
    const svg = container.querySelector('svg.lucide-triangle-alert');
    expect(svg).not.toBeNull();
  });
});
