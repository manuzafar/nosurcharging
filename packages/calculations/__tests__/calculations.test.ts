import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '../calculations';
import { detectStrategicRate, getCategory } from '../categories';
import { resolveAssessmentInputs } from '../rules/resolver';
import type {
  ResolvedAssessmentInputs,
  RawAssessmentData,
  ResolutionContext,
} from '../types';

// Pre-reform test date — all scenarios use this
const PRE_REFORM = new Date('2026-04-01T00:00:00Z');

// Default card mix breakdown (regulatory constants)
const DEFAULT_BREAKDOWN = {
  visa_debit: 0.35,
  visa_credit: 0.18,
  mastercard_debit: 0.17,
  mastercard_credit: 0.12,
  eftpos: 0.08,
  amex: 0.05,
  foreign: 0.05,
  commercial: 0,
};

// Helper: build resolved inputs with defaults from calculation-verification.md
function makeInputs(overrides: Partial<ResolvedAssessmentInputs>): ResolvedAssessmentInputs {
  return {
    volume: 2_000_000,
    planType: 'costplus',
    msfRate: 0.014,
    surcharging: false,
    surchargeRate: 0,
    surchargeNetworks: [],
    industry: 'retail',
    psp: 'Stripe',
    passThrough: 0,
    cardMix: {
      debitShare: 0.60,
      consumerCreditShare: 0.35,
      foreignShare: 0.05,
      amexShare: 0.05,
      commercialShare: 0,
      breakdown: DEFAULT_BREAKDOWN,
    },
    avgTransactionValue: 65,
    expertRates: {
      debitCents: 9,   // 9 cents
      creditPct: 0.47, // 0.47% (RBA confirmed market average, Conclusions Paper March 2026)
      marginPct: 0.10, // 0.10%
    },
    resolutionTrace: {},
    confidence: 'low',
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════
// Scenario 1 — Category 1: $2M, cost-plus, not surcharging
// Ground truth (creditPct default = 0.47%): plSwing = +$1,350.00
// ══════════════════════════════════════════════════════════════════

describe('Scenario 1 — Cat 1: $2M, cost-plus, not surcharging', () => {
  const inputs = makeInputs({
    volume: 2_000_000,
    planType: 'costplus',
    surcharging: false,
    surchargeRate: 0,
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 1', () => {
    expect(result.category).toBe(1);
  });

  it('calculates debitSaving = $160.00', () => {
    expect(result.debitSaving).toBeCloseTo(160.00, 1);
  });

  it('calculates creditSaving = $1,190.00', () => {
    expect(result.creditSaving).toBeCloseTo(1190.0, 1);
  });

  it('calculates icSaving = $1,350.00', () => {
    expect(result.icSaving).toBeCloseTo(1350.00, 1);
  });

  it('calculates grossCOA = $9,051.54', () => {
    expect(result.grossCOA).toBeCloseTo(9051.54, 1);
  });

  it('calculates netToday = $9,051.54', () => {
    expect(result.netToday).toBeCloseTo(9051.54, 1);
  });

  it('calculates octNet = $7,701.54', () => {
    expect(result.octNet).toBeCloseTo(7701.54, 1);
  });

  it('calculates plSwing = +$1,350.00', () => {
    expect(result.plSwing).toBeCloseTo(1350.00, 1);
  });

  it('calculates todayScheme = $2,100.00', () => {
    expect(result.todayScheme).toBeCloseTo(2100.0, 1);
  });

  it('calculates oct2026Scheme = $2,100.00', () => {
    expect(result.oct2026Scheme).toBeCloseTo(2100.0, 1);
  });

  it('scheme fees invariant: todayScheme === oct2026Scheme', () => {
    expect(result.todayScheme).toBe(result.oct2026Scheme);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 2 — Category 2: $2M, flat rate, not surcharging
// Three pass-through levels
// ══════════════════════════════════════════════════════════════════

describe('Scenario 2 — Cat 2: $2M, flat rate, not surcharging', () => {
  const baseInputs = makeInputs({
    volume: 2_000_000,
    planType: 'flat',
    surcharging: false,
    surchargeRate: 0,
    msfRate: 0.014,
  });

  it('assigns category 2', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0 }, PRE_REFORM);
    expect(result.category).toBe(2);
  });

  it('icSaving = $1,350.00 (same as Scenario 1)', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0 }, PRE_REFORM);
    expect(result.icSaving).toBeCloseTo(1350.00, 1);
  });

  it('at 0% pass-through: plSwing = $0.00', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(0.0, 1);
  });

  it('at 45% pass-through: plSwing = +$607.50', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0.45 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(607.50, 1);
  });

  it('at 100% pass-through: plSwing = +$1,350.00', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 1.0 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(1350.00, 1);
  });

  it('at 100% pass-through: plSwing === icSaving (mathematical invariant)', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 1.0 }, PRE_REFORM);
    expect(Math.abs(result.plSwing - result.icSaving)).toBeLessThan(0.02);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 3 — Category 3: $10M, cost-plus, surcharging 1.2%
// Ground truth (creditPct default = 0.47%): plSwing = -$101,250.00
// ══════════════════════════════════════════════════════════════════

describe('Scenario 3 — Cat 3: $10M, cost-plus, surcharging 1.2%', () => {
  const inputs = makeInputs({
    volume: 10_000_000,
    planType: 'costplus',
    surcharging: true,
    surchargeRate: 0.012,
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 3', () => {
    expect(result.category).toBe(3);
  });

  it('calculates debitSaving = $800.00', () => {
    expect(result.debitSaving).toBeCloseTo(800.00, 1);
  });

  it('calculates icSaving = $6,750.00', () => {
    expect(result.icSaving).toBeCloseTo(6750.00, 1);
  });

  it('calculates grossCOA = $45,257.69', () => {
    expect(result.grossCOA).toBeCloseTo(45257.69, 1);
  });

  it('calculates surchargeRevenue = $108,000', () => {
    expect(result.surchargeRevenue).toBeCloseTo(108000.00, 1);
  });

  it('calculates netToday = -$62,742.31', () => {
    expect(result.netToday).toBeCloseTo(-62742.31, 1);
  });

  it('calculates octNet = $38,507.69', () => {
    expect(result.octNet).toBeCloseTo(38507.69, 1);
  });

  it('calculates plSwing = -$101,250.00', () => {
    expect(result.plSwing).toBeCloseTo(-101250.00, 1);
  });

  it('scheme fees invariant: todayScheme === oct2026Scheme', () => {
    expect(result.todayScheme).toBe(result.oct2026Scheme);
    expect(result.todayScheme).toBeCloseTo(10500.0, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 4 — Category 4: $3M, flat rate, surcharging 1.2%, 45% PT
// Ground truth (creditPct default = 0.47%): plSwing = -$31,488.75
// ══════════════════════════════════════════════════════════════════

describe('Scenario 4 — Cat 4: $3M, flat rate, surcharging 1.2%, 45% PT', () => {
  const inputs = makeInputs({
    volume: 3_000_000,
    planType: 'flat',
    surcharging: true,
    surchargeRate: 0.012,
    msfRate: 0.014,
    passThrough: 0.45,
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 4', () => {
    expect(result.category).toBe(4);
  });

  it('calculates debitSaving = $240.00', () => {
    expect(result.debitSaving).toBeCloseTo(240.00, 1);
  });

  it('calculates icSaving = $2,025.00', () => {
    expect(result.icSaving).toBeCloseTo(2025.00, 1);
  });

  it('calculates surchargeRevenue = $32,400', () => {
    expect(result.surchargeRevenue).toBeCloseTo(32400.00, 1);
  });

  it('calculates netToday = $9,600.00', () => {
    expect(result.netToday).toBeCloseTo(9600.00, 1);
  });

  it('calculates octNet = $41,088.75', () => {
    expect(result.octNet).toBeCloseTo(41088.75, 1);
  });

  it('calculates plSwing = -$31,488.75', () => {
    expect(result.plSwing).toBeCloseTo(-31488.75, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 5 — Expert mode: $5M, cost-plus, debit 7c (below 8c cap)
// Ground truth: debitSaving = $0.00, plSwing = +$1,750.00
// ══════════════════════════════════════════════════════════════════

describe('Scenario 5 — Expert mode: $5M, cost-plus, debit 7c below cap', () => {
  const inputs = makeInputs({
    volume: 5_000_000,
    planType: 'costplus',
    surcharging: false,
    surchargeRate: 0,
    expertRates: {
      debitCents: 7,   // below 8c reform cap
      creditPct: 0.40, // above 0.30% cap
      marginPct: 0.08,
    },
    confidence: 'high',
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 1', () => {
    expect(result.category).toBe(1);
  });

  it('debitSaving = $0.00 exactly (not negative)', () => {
    expect(result.debitSaving).toBe(0);
  });

  it('debitSaving >= 0 (invariant)', () => {
    expect(result.debitSaving).toBeGreaterThanOrEqual(0);
  });

  it('creditSaving = $1,750.00', () => {
    expect(result.creditSaving).toBeCloseTo(1750.0, 1);
  });

  it('icSaving = $1,750.00', () => {
    expect(result.icSaving).toBeCloseTo(1750.0, 1);
  });

  it('plSwing = +$1,750.00', () => {
    expect(result.plSwing).toBeCloseTo(1750.0, 1);
  });

  it('confidence = high', () => {
    expect(result.confidence).toBe('high');
  });
});

// ══════════════════════════════════════════════════════════════════
// Edge cases and invariants
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// Scenario 6 — Surcharge network share
// ══════════════════════════════════════════════════════════════════

describe('Scenario 6 — Surcharge network share', () => {
  it('empty networks + surcharging=true → designated share = 0.90', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: [],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.surchargeRevenue).toBeCloseTo(108000.00, 1);
  });

  it('visa+mastercard only → share = 0.82', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: ['visa', 'mastercard'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    // 0.35+0.18+0.17+0.12 = 0.82
    expect(result.surchargeRevenue).toBeCloseTo(98400.00, 1);
  });

  it('visa only → share = 0.53', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: ['visa'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    // 0.35+0.18 = 0.53
    expect(result.surchargeRevenue).toBeCloseTo(63600.00, 1);
  });

  it('amex only → $0 (not designated)', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: ['amex'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.surchargeRevenue).toBe(0);
  });

  it('amex only → category 1 (treated as non-surcharging — no designated revenue at risk)', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: ['amex'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.category).toBe(1);
  });

  it('amex only → plSwing is positive (saving, not a loss)', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: true,
      surchargeRate: 0.012, surchargeNetworks: ['amex'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.plSwing).toBeGreaterThan(0);
  });

  it('not surcharging → $0 regardless of networks', () => {
    const inputs = makeInputs({
      volume: 10_000_000, planType: 'costplus', surcharging: false,
      surchargeRate: 0.012, surchargeNetworks: ['visa', 'mastercard'],
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.surchargeRevenue).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Regression — empty surchargeNetworks with surcharging=true
// Must produce same result as all-designated (backward compatible)
// ══════════════════════════════════════════════════════════════════

describe('Regression — empty surchargeNetworks with surcharging=true is backward compatible', () => {
  const withEmpty = makeInputs({
    planType: 'flat',
    surcharging: true,
    surchargeRate: 0.015,
    surchargeNetworks: [],
    msfRate: 0.014,
    passThrough: 0,
  });

  const withAllDesignated = makeInputs({
    planType: 'flat',
    surcharging: true,
    surchargeRate: 0.015,
    surchargeNetworks: ['visa', 'mastercard', 'eftpos'],
    msfRate: 0.014,
    passThrough: 0,
  });

  it('empty networks produces same category as all-designated', () => {
    const r1 = calculateMetrics(withEmpty, PRE_REFORM);
    const r2 = calculateMetrics(withAllDesignated, PRE_REFORM);
    expect(r1.category).toBe(r2.category);
  });

  it('empty networks produces same surchargeRevenue as all-designated', () => {
    const r1 = calculateMetrics(withEmpty, PRE_REFORM);
    const r2 = calculateMetrics(withAllDesignated, PRE_REFORM);
    expect(r1.surchargeRevenue).toBeCloseTo(r2.surchargeRevenue, 2);
  });

  it('empty networks produces same plSwing as all-designated', () => {
    const r1 = calculateMetrics(withEmpty, PRE_REFORM);
    const r2 = calculateMetrics(withAllDesignated, PRE_REFORM);
    expect(r1.plSwing).toBeCloseTo(r2.plSwing, 2);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 6b — Café AVT=$35 lower-of clause
// Confirms lower-of formula produces material debit saving for cafés
// At AVT=$35: projected rate = min(8c, 0.16% × 35) = min(8c, 5.6c) = 5.6c
//             current rate   = min(9c, 0.20% × 35) = min(9c, 7.0c) = 7.0c
//             saving per txn = 1.4c (not the flat 1c at AVT≥$50)
// ══════════════════════════════════════════════════════════════════

describe('Scenario 6b — Café AVT=$35 lower-of clause', () => {
  const inputs = makeInputs({
    volume: 6_000_000,
    planType: 'costplus',
    surcharging: false,
    surchargeRate: 0,
    avgTransactionValue: 35,
    industry: 'cafe',
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('debitSaving > $1,100 (confirms lower-of active, not flat 1c saving)', () => {
    expect(result.debitSaving).toBeGreaterThan(1100);
  });

  it('debitSaving ≈ $1,248.00 (6M × 0.52/35 × 1.4c)', () => {
    // visaMcDebitTxns = 6,000,000 × 0.52 / 35 = 89,142.86
    // saving/txn = 0.014
    // debitSaving = 89,142.86 × 0.014 = $1,248.00
    expect(result.debitSaving).toBeCloseTo(1248.00, 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Lower-of kink invariants — verify formula behaves correctly around $50
// ══════════════════════════════════════════════════════════════════

describe('Lower-of kink invariants', () => {
  it('debitSaving at AVT=$25 > debitSaving at AVT=$65 (kink active below $50)', () => {
    const below = calculateMetrics(makeInputs({ avgTransactionValue: 25 }), PRE_REFORM);
    const above = calculateMetrics(makeInputs({ avgTransactionValue: 65 }), PRE_REFORM);
    expect(below.debitSaving).toBeGreaterThan(above.debitSaving);
  });

  it('at AVT=$50, per-txn saving equals above-kink (both yield 1c per txn)', () => {
    const atKink = calculateMetrics(makeInputs({ avgTransactionValue: 50 }), PRE_REFORM);
    const above  = calculateMetrics(makeInputs({ avgTransactionValue: 65 }), PRE_REFORM);
    // At AVT≥$50 the lower-of is not binding (cents caps win).
    // Saving/txn is 1c in both cases; total debitSaving scales inversely with AVT.
    expect(atKink.debitSaving).toBeCloseTo(above.debitSaving * (65 / 50), 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 7 — Cat 5: $600K, zero_cost, market estimate (1.4%)
// netToday = 0; octNet = volume × estimatedMSFRate; plSwing = -octNet
// Range: low = -volume×0.016 (worst), high = -volume×0.012 (best)
// ══════════════════════════════════════════════════════════════════

describe('Scenario 7 — Cat 5: $600K, zero_cost, market estimate (1.4%)', () => {
  const inputs = makeInputs({
    volume: 600_000,
    planType: 'zero_cost',
    isZeroCost: true,
    estimatedMSFRate: 0.014,
    surcharging: false,
    surchargeRate: 0,
    surchargeNetworks: [],
    passThrough: 0,
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 5', () => {
    expect(result.category).toBe(5);
  });

  it('netToday = $0 (PSP-mediated surcharge zeroes net)', () => {
    expect(result.netToday).toBeCloseTo(0, 1);
  });

  it('octNet = $8,400 (600K × 1.4%)', () => {
    expect(result.octNet).toBeCloseTo(8400.0, 1);
  });

  it('plSwing = -$8,400 (netToday − octNet)', () => {
    expect(result.plSwing).toBeCloseTo(-8400.0, 1);
  });

  it('plSwingLow = -$9,600 (worst case, 1.6% rate)', () => {
    expect(result.plSwingLow).toBeCloseTo(-9600.0, 1);
  });

  it('plSwingHigh = -$7,200 (best case, 1.2% rate)', () => {
    expect(result.plSwingHigh).toBeCloseTo(-7200.0, 1);
  });

  it('plSwingLow ≤ plSwing ≤ plSwingHigh (range invariant holds)', () => {
    expect(result.plSwingLow).toBeLessThanOrEqual(result.plSwing);
    expect(result.plSwing).toBeLessThanOrEqual(result.plSwingHigh);
  });

  it('rangeDriver = post_reform_rate', () => {
    expect(result.rangeDriver).toBe('post_reform_rate');
  });

  it('icSaving still computed for transparency (>0)', () => {
    expect(result.icSaving).toBeGreaterThan(0);
  });

  it('todayScheme === oct2026Scheme (scheme fees invariant holds)', () => {
    expect(result.todayScheme).toBe(result.oct2026Scheme);
  });

  it('debitSaving >= 0 (invariant holds)', () => {
    expect(result.debitSaving).toBeGreaterThanOrEqual(0);
  });

  it('estimatedMSFRate echoed in outputs', () => {
    expect(result.estimatedMSFRate).toBe(0.014);
  });
});

describe('Scenario 7b — Cat 5 with custom rate (1.3%)', () => {
  it('uses custom estimatedMSFRate', () => {
    const inputs = makeInputs({
      volume: 600_000,
      planType: 'zero_cost',
      isZeroCost: true,
      estimatedMSFRate: 0.013,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.octNet).toBeCloseTo(7800.0, 1);
    expect(result.plSwing).toBeCloseTo(-7800.0, 1);
    expect(result.estimatedMSFRate).toBe(0.013);
  });
});

describe('Scenario 7c — Cat 5 with separate Amex surcharge (preserved, ignored by P&L)', () => {
  it('plSwing identical with/without Amex flag', () => {
    const base = makeInputs({
      volume: 600_000,
      planType: 'zero_cost',
      isZeroCost: true,
      estimatedMSFRate: 0.014,
    });
    const withAmex = makeInputs({
      volume: 600_000,
      planType: 'zero_cost',
      isZeroCost: true,
      estimatedMSFRate: 0.014,
      surcharging: true,
      surchargeRate: 0.015,
      surchargeNetworks: ['visa', 'mastercard', 'eftpos', 'amex'],
    });
    const r1 = calculateMetrics(base, PRE_REFORM);
    const r2 = calculateMetrics(withAmex, PRE_REFORM);
    expect(r1.plSwing).toBeCloseTo(r2.plSwing, 1);
    expect(r2.surchargeRevenue).toBeGreaterThanOrEqual(0);
    expect(r2.category).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 8 — Blended rate
// ══════════════════════════════════════════════════════════════════

describe('Scenario 8 — Blended rate', () => {
  it('effectiveMSFRate = weighted average of debit and credit', () => {
    const inputs = makeInputs({
      volume: 1_000_000, planType: 'blended', msfRate: 0.014,
      debitRate: 0.009, creditRate: 0.018,
      surcharging: false,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    // effectiveMSFRate = 0.009×0.60 + 0.018×0.35 + 0.014×0.05
    // = 0.0054 + 0.0063 + 0.0007 = 0.0124
    // annualMSF = 1,000,000 × 0.0124 = $12,400
    expect(result.annualMSF).toBeCloseTo(12400.00, 0);
  });

  it('assigns category 2 for blended, not surcharging', () => {
    const inputs = makeInputs({ planType: 'blended', surcharging: false });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.category).toBe(2);
  });

  it('assigns category 4 for blended, surcharging', () => {
    const inputs = makeInputs({ planType: 'blended', surcharging: true, surchargeRate: 0.012 });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.category).toBe(4);
  });

  it('without debitRate/creditRate falls back to msfRate', () => {
    const inputs = makeInputs({ volume: 1_000_000, planType: 'blended', msfRate: 0.014 });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.annualMSF).toBeCloseTo(14000.00, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 9 — ATV-dependent debit (lower-of rule)
// ══════════════════════════════════════════════════════════════════

describe('Scenario 9 — ATV-dependent debit', () => {
  it('ATV $15: pct wins (MIN(9c, 0.2%×$15=3c) → 3c)', () => {
    const inputs = makeInputs({
      volume: 2_000_000, planType: 'costplus', avgTransactionValue: 15,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    // currentDebitICPerTxn = MIN(0.09, 0.002×15) = MIN(0.09, 0.03) = 0.03
    // projectedDebitICPerTxn = MIN(0.08, 0.0016×15) = MIN(0.08, 0.024) = 0.024
    // visaMcDebitTxns = (2M × 0.52) / 15 = 69,333.33
    // debitSaving = 69,333.33 × (0.03 - 0.024) = $416.00
    expect(result.debitSaving).toBeCloseTo(416.00, 0);
  });

  it('ATV $65: cents cap wins (MIN(9c, 0.2%×$65=13c) → 9c)', () => {
    const inputs = makeInputs({
      volume: 2_000_000, planType: 'costplus', avgTransactionValue: 65,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.debitSaving).toBeCloseTo(160.00, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 10 — Strategic rate detection + getCategory defensive
// ══════════════════════════════════════════════════════════════════

describe('Scenario 10 — Strategic rate detection', () => {
  it('self-reported strategic_rate → detected', () => {
    const result = detectStrategicRate('strategic_rate', 1_000_000, 'Stripe');
    expect(result.detected).toBe(true);
    expect(result.triggerReason).toBe('self_reported');
  });

  it('$50M+ volume at CommBank → detected', () => {
    const result = detectStrategicRate('flat', 50_000_000, 'CommBank');
    expect(result.detected).toBe(true);
    expect(result.triggerReason).toBe('volume_threshold');
  });

  it('$50M+ volume at Stripe → NOT detected (not a bank)', () => {
    const result = detectStrategicRate('flat', 50_000_000, 'Stripe');
    expect(result.detected).toBe(false);
    expect(result.triggerReason).toBeNull();
  });

  it('$10M at CommBank → NOT detected (volume too low)', () => {
    const result = detectStrategicRate('flat', 10_000_000, 'CommBank');
    expect(result.detected).toBe(false);
  });

  it('$50M+ at ANZ → detected', () => {
    const result = detectStrategicRate('costplus', 60_000_000, 'ANZ Worldline');
    expect(result.detected).toBe(true);
    expect(result.triggerReason).toBe('volume_threshold');
  });
});

describe('getCategory — blended normalises, zero_cost short-circuits', () => {
  it('blended + not surcharging → category 2', () => {
    expect(getCategory('blended', false)).toBe(2);
  });

  it('blended + surcharging → category 4', () => {
    expect(getCategory('blended', true)).toBe(4);
  });

  it('zero_cost short-circuits to category 5', () => {
    expect(getCategory('zero_cost', false)).toBe(5);
    expect(getCategory('zero_cost', true)).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
// Range invariants
// ══════════════════════════════════════════════════════════════════

describe('Range invariants', () => {
  it('plSwingLow <= plSwing <= plSwingHigh for flat non-surcharging', () => {
    const inputs = makeInputs({ planType: 'flat', passThrough: 0.45, surcharging: false });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.plSwingLow).toBeLessThanOrEqual(result.plSwing);
    expect(result.plSwing).toBeLessThanOrEqual(result.plSwingHigh);
  });

  it('plSwingLow and plSwingHigh are same at any passThrough value', () => {
    const inputs50 = makeInputs({ planType: 'flat', passThrough: 0.50, surcharging: false });
    const inputs80 = makeInputs({ planType: 'flat', passThrough: 0.80, surcharging: false });
    const r50 = calculateMetrics(inputs50, PRE_REFORM);
    const r80 = calculateMetrics(inputs80, PRE_REFORM);
    expect(r50.plSwingLow).toBe(r80.plSwingLow);
    expect(r50.plSwingHigh).toBe(r80.plSwingHigh);
  });

  it('cost-plus range is ±20% of icSaving', () => {
    const inputs = makeInputs({ planType: 'costplus', surcharging: false });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.plSwingLow).toBeCloseTo(result.icSaving * 0.80, 1);
    expect(result.plSwingHigh).toBeCloseTo(result.icSaving * 1.20, 1);
  });

  it('rangeDriver is pass_through for flat', () => {
    const inputs = makeInputs({ planType: 'flat', surcharging: false });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.rangeDriver).toBe('pass_through');
  });

  it('rangeDriver is card_mix for costplus', () => {
    const inputs = makeInputs({ planType: 'costplus', surcharging: false });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.rangeDriver).toBe('card_mix');
  });
});

describe('Edge cases and invariants', () => {
  it('volume=0 produces no NaN', () => {
    const inputs = makeInputs({ volume: 0 });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(isNaN(result.plSwing)).toBe(false);
    expect(isNaN(result.icSaving)).toBe(false);
    expect(isNaN(result.netToday)).toBe(false);
    expect(isNaN(result.octNet)).toBe(false);
  });

  it('volume=$1B produces no Infinity', () => {
    const inputs = makeInputs({ volume: 1_000_000_000 });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(isFinite(result.plSwing)).toBe(true);
    expect(isFinite(result.icSaving)).toBe(true);
    expect(isFinite(result.netToday)).toBe(true);
    expect(isFinite(result.octNet)).toBe(true);
  });

  it('todayScheme === oct2026Scheme for any valid input', () => {
    const volumes = [0, 100_000, 2_000_000, 50_000_000, 1_000_000_000];
    for (const vol of volumes) {
      const result = calculateMetrics(makeInputs({ volume: vol }), PRE_REFORM);
      expect(result.todayScheme).toBe(result.oct2026Scheme);
    }
  });

  it('all numeric outputs are finite for valid inputs', () => {
    const result = calculateMetrics(makeInputs({}), PRE_REFORM);
    const numericFields: (keyof typeof result)[] = [
      'icSaving', 'debitSaving', 'creditSaving',
      'netToday', 'octNet', 'plSwing',
      'todayScheme', 'oct2026Scheme',
    ];
    for (const field of numericFields) {
      expect(isFinite(result[field] as number)).toBe(true);
      expect(isNaN(result[field] as number)).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// Sprint 3 — Minimum monthly fee floor
// Many PSP contracts include a minimum monthly charge. For low-volume
// merchants, this floor is what they actually pay — not volume × rate.
// ══════════════════════════════════════════════════════════════════

describe('Sprint 3 — minMonthlyFee floor on annualMSF', () => {
  const LOW_VOLUME = 100_000;  // $100k × 1.4% = $1,400/year without floor

  it('no floor: annualMSF = volume × rate', () => {
    const inputs = makeInputs({
      volume: LOW_VOLUME,
      planType: 'flat',
      msfRate: 0.014,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.annualMSF).toBeCloseTo(1400.0, 1);
  });

  it('floor above base: annualMSF = minMonthlyFee × 12', () => {
    const inputs = makeInputs({
      volume: LOW_VOLUME,
      planType: 'flat',
      msfRate: 0.014,
      minMonthlyFee: 200, // $200/month × 12 = $2,400/year > $1,400 base
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.annualMSF).toBeCloseTo(2400.0, 1);
  });

  it('floor below base: annualMSF = volume × rate (base wins)', () => {
    const inputs = makeInputs({
      volume: LOW_VOLUME,
      planType: 'flat',
      msfRate: 0.014,
      minMonthlyFee: 50, // $600/year < $1,400 base
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.annualMSF).toBeCloseTo(1400.0, 1);
  });

  it('floor with zero volume: annualMSF = minMonthlyFee × 12', () => {
    const inputs = makeInputs({
      volume: 0,
      planType: 'flat',
      msfRate: 0.014,
      minMonthlyFee: 30,
    });
    const result = calculateMetrics(inputs, PRE_REFORM);
    expect(result.annualMSF).toBeCloseTo(360.0, 1);
  });

  it('undefined minMonthlyFee behaves identically to absent (no floor applied)', () => {
    const baseInputs = makeInputs({ volume: LOW_VOLUME, planType: 'flat', msfRate: 0.014 });
    const a = calculateMetrics(baseInputs, PRE_REFORM);
    const b = calculateMetrics({ ...baseInputs, minMonthlyFee: undefined }, PRE_REFORM);
    expect(a.annualMSF).toBe(b.annualMSF);
  });
});

// ══════════════════════════════════════════════════════════════════
// Phase 2 audit fix — resolver default debitCents 9 → 7
// ══════════════════════════════════════════════════════════════════
// The RBA Conclusions Paper (March 2026) states the weighted-average
// domestic debit/prepaid interchange has fallen to ~6c. Using 9c as the
// default overstates current cost and the projected saving for the
// typical merchant. The resolver default is now 7c (midpoint estimate),
// which is below the 8c reform cap — so the engine produces zero debit
// saving for any merchant who falls back to the default.
//
// This test goes through the resolver (NOT the makeInputs fixture), so
// it exercises the production codepath a merchant who doesn't supply
// expert rates would actually take.

describe('Phase 2 audit fix — resolver-default debit rate floors saving at zero', () => {
  function rawDefaults(overrides: Partial<RawAssessmentData> = {}): RawAssessmentData {
    return {
      volume: 2_000_000,
      planType: 'costplus',
      msfRate: 0.014,
      surcharging: false,
      surchargeRate: 0,
      surchargeNetworks: [],
      industry: 'retail',
      psp: 'Stripe',
      passThrough: 0,
      country: 'AU',
      ...overrides,
    };
  }

  const ctx: ResolutionContext = { country: 'AU', industry: 'retail' };

  it('resolver default for debitCents is 7 (post-audit, was 9)', () => {
    const resolved = resolveAssessmentInputs(rawDefaults(), ctx);
    expect(resolved.expertRates.debitCents).toBe(7);
  });

  it('debit saving is zero when resolver default applies (7c < 8c reform cap)', () => {
    const resolved = resolveAssessmentInputs(rawDefaults(), ctx);
    const result = calculateMetrics(resolved, PRE_REFORM);
    expect(result.debitSaving).toBe(0);
  });

  it('credit saving still flows through (creditPct 0.47% → 0.30% reform cap)', () => {
    const resolved = resolveAssessmentInputs(rawDefaults(), ctx);
    const result = calculateMetrics(resolved, PRE_REFORM);
    // Industry 'retail' card mix: visa_credit 0.18 + mc_credit 0.12 = 0.30
    // creditSaving = 2,000,000 × 0.30 × (0.0047 - 0.003) = $1,020
    expect(result.creditSaving).toBeCloseTo(1020.0, 1);
  });

  it('merchant-supplied expert debitCents overrides the resolver default', () => {
    const resolved = resolveAssessmentInputs(
      rawDefaults(),
      {
        country: 'AU',
        industry: 'retail',
        merchantInput: { expertRates: { debitCents: 9 } },
      },
    );
    expect(resolved.expertRates.debitCents).toBe(9);
    const result = calculateMetrics(resolved, PRE_REFORM);
    // 9c → 8c cap, debit saving > 0
    expect(result.debitSaving).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Phase 3 audit fix — travel industry ATV
// ══════════════════════════════════════════════════════════════════
// 'travel' was missing from AU_AVG_TXN_BY_INDUSTRY, so a travel
// merchant fell back to the $65 default — overstating debit
// transaction count by 5x (real travel ATV is ~$300-600). Added
// travel: 350 to the constant.

describe('Phase 3 audit fix — travel industry resolves to $350 ATV', () => {
  const ctx: ResolutionContext = { country: 'AU', industry: 'travel' };

  it('avgTransactionValue = 350 for travel industry (was falling back to 65)', () => {
    const resolved = resolveAssessmentInputs(
      {
        volume: 5_000_000,
        planType: 'costplus',
        msfRate: 0.014,
        surcharging: false,
        surchargeRate: 0,
        surchargeNetworks: [],
        industry: 'travel',
        psp: 'Stripe',
        passThrough: 0,
        country: 'AU',
      },
      ctx,
    );
    expect(resolved.avgTransactionValue).toBe(350);
  });
});
