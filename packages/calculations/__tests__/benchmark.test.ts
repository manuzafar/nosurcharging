// packages/calculations/__tests__/benchmark.test.ts
//
// Covers buildBenchmarkComparison() across the four locked variants
// from RESULTS_CONTENT_CREDIBILITY_BRIEF.md Section 3.3.

import { describe, it, expect } from 'vitest';
import { buildBenchmarkComparison } from '../benchmark';
import type { AssessmentOutputs, ResolvedAssessmentInputs } from '../types';

// Minimum viable fixtures — the helper only reads volume,
// merchantEffectiveRate, postReformIcRate, weightedSchemeRate, and
// pspKey. Everything else is structural noise that the type demands.
function makeInputs(volume: number): ResolvedAssessmentInputs {
  return {
    volume,
  } as unknown as ResolvedAssessmentInputs;
}

function makeOutputs(merchantRate: number): AssessmentOutputs {
  return {
    merchantEffectiveRate: merchantRate,
    postReformIcRate: 0.0055,    // typical post-reform IC weighted average
    weightedSchemeRate: 0.00105, // domesticPct, invariant
  } as unknown as AssessmentOutputs;
}

describe('buildBenchmarkComparison', () => {
  it('Stripe customer at 2.1% → above_list, positive saving', () => {
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.021),
      'Stripe',
    );
    expect(result.comparison).toBe('above_list');
    expect(result.pspListRate).toBe(0.0175);
    // delta = 0.021 - 0.0175 = 0.0035 → 35bps. Saving = 0.0035 × 1M = 3,500.
    expect(result.potentialAnnualSaving).toBe(3_500);
  });

  it('Stripe customer at 1.75% (== list) → at_list', () => {
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.0175),
      'Stripe',
    );
    expect(result.comparison).toBe('at_list');
    expect(result.pspListRate).toBe(0.0175);
  });

  it('Tyro customer at 1.2% → below_list', () => {
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.012),
      'Tyro',
    );
    expect(result.comparison).toBe('below_list');
    expect(result.pspListRate).toBe(0.014);
  });

  it('CommBank customer → no_list_anchor (bank acquirer, negotiated)', () => {
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.013),
      'CommBank',
    );
    expect(result.comparison).toBe('no_list_anchor');
    expect(result.pspListRate).toBeNull();
  });

  it('Adyen customer → no_list_anchor (cost-plus only)', () => {
    const result = buildBenchmarkComparison(
      makeInputs(2_000_000),
      makeOutputs(0.012),
      'Adyen',
    );
    expect(result.comparison).toBe('no_list_anchor');
    expect(result.pspListRate).toBeNull();
  });

  it('unknown PSP key → no_list_anchor (defensive fallback)', () => {
    const result = buildBenchmarkComparison(
      makeInputs(500_000),
      makeOutputs(0.015),
      'NoSuchPSP',
    );
    expect(result.comparison).toBe('no_list_anchor');
    expect(result.pspListRate).toBeNull();
  });

  it('postReformFloor = postReformIcRate + weightedSchemeRate + 0.20% margin', () => {
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.02),
      'Stripe',
    );
    // 0.0055 IC + 0.00105 scheme + 0.002 min margin = 0.00855
    expect(result.postReformFloor).toBeCloseTo(0.00855, 5);
  });

  it('within ±5bps of list rate classifies as at_list', () => {
    // 0.0175 - 0.0004 = 0.0171 — inside the 5bps tolerance.
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.0171),
      'Stripe',
    );
    expect(result.comparison).toBe('at_list');
  });

  it('>5bps above list classifies as above_list', () => {
    // 0.0175 + 0.0006 = 0.0181 — just outside tolerance.
    const result = buildBenchmarkComparison(
      makeInputs(1_000_000),
      makeOutputs(0.0181),
      'Stripe',
    );
    expect(result.comparison).toBe('above_list');
  });
});
