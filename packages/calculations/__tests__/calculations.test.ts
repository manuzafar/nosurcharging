import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '../calculations';
import type { ResolvedAssessmentInputs } from '../types';

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
      creditPct: 0.52, // 0.52%
      marginPct: 0.10, // 0.10%
    },
    resolutionTrace: {},
    confidence: 'low',
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════
// Scenario 1 — Category 1: $2M, cost-plus, not surcharging
// Ground truth: plSwing = +$1,724.62
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

  it('calculates debitSaving = $184.62', () => {
    expect(result.debitSaving).toBeCloseTo(184.62, 1);
  });

  it('calculates creditSaving = $1,540.00', () => {
    expect(result.creditSaving).toBeCloseTo(1540.0, 1);
  });

  it('calculates icSaving = $1,724.62', () => {
    expect(result.icSaving).toBeCloseTo(1724.62, 1);
  });

  it('calculates netToday = $9,401.54', () => {
    expect(result.netToday).toBeCloseTo(9401.54, 1);
  });

  it('calculates octNet = $7,676.92', () => {
    expect(result.octNet).toBeCloseTo(7676.92, 1);
  });

  it('calculates plSwing = +$1,724.62', () => {
    expect(result.plSwing).toBeCloseTo(1724.62, 1);
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

  it('icSaving = $1,724.62 (same as Scenario 1)', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0 }, PRE_REFORM);
    expect(result.icSaving).toBeCloseTo(1724.62, 1);
  });

  it('at 0% pass-through: plSwing = $0.00', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(0.0, 1);
  });

  it('at 45% pass-through: plSwing = +$776.08', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 0.45 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(776.08, 1);
  });

  it('at 100% pass-through: plSwing = +$1,724.62', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 1.0 }, PRE_REFORM);
    expect(result.plSwing).toBeCloseTo(1724.62, 1);
  });

  it('at 100% pass-through: plSwing === icSaving (mathematical invariant)', () => {
    const result = calculateMetrics({ ...baseInputs, passThrough: 1.0 }, PRE_REFORM);
    expect(Math.abs(result.plSwing - result.icSaving)).toBeLessThan(0.02);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 3 — Category 3: $10M, cost-plus, surcharging 1.2%
// Ground truth: plSwing = -$111,376.92
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

  it('calculates icSaving = $8,623.08', () => {
    expect(result.icSaving).toBeCloseTo(8623.08, 1);
  });

  it('calculates netToday = -$72,992.31 (surplus from surcharging)', () => {
    expect(result.netToday).toBeCloseTo(-72992.31, 1);
  });

  it('calculates octNet = $38,384.61', () => {
    expect(result.octNet).toBeCloseTo(38384.61, 1);
  });

  it('calculates plSwing = -$111,376.92 (merchant $111K worse off)', () => {
    expect(result.plSwing).toBeCloseTo(-111376.92, 1);
  });

  it('scheme fees invariant: todayScheme === oct2026Scheme', () => {
    expect(result.todayScheme).toBe(result.oct2026Scheme);
    expect(result.todayScheme).toBeCloseTo(10500.0, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Scenario 4 — Category 4: $3M, flat rate, surcharging 1.2%, 45% PT
// Ground truth: plSwing = -$34,835.89
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

  it('calculates icSaving = $2,586.92', () => {
    expect(result.icSaving).toBeCloseTo(2586.92, 1);
  });

  it('calculates netToday = $6,000.00', () => {
    expect(result.netToday).toBeCloseTo(6000.0, 1);
  });

  it('calculates octNet = $40,835.89', () => {
    expect(result.octNet).toBeCloseTo(40835.89, 1);
  });

  it('calculates plSwing = -$34,835.89', () => {
    expect(result.plSwing).toBeCloseTo(-34835.89, 1);
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
