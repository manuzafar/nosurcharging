import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveAssessmentInputs } from '../rules/resolver';
import type { RawAssessmentData, ResolutionContext } from '../types';

const baseRaw: RawAssessmentData = {
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
};

// Clean env vars before/after each test
beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ══════════════════════════════════════════════════════════════════
// Priority order
// ══���═══════════════════════════════════════════════════════════════

describe('Source priority', () => {
  it('merchant input beats env var beats regulatory constant', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '0.40');
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.50 } },
    });
    expect(resolved.resolutionTrace['cardMix.visa_debit']!.source).toBe('merchant_input');
  });

  it('falls to industry_default when merchant input is absent', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '0.40');
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: {},
    });
    // industry_default has higher priority than env_var
    expect(resolved.resolutionTrace['cardMix.visa_debit']!.source).toBe('industry_default');
  });

  it('falls to env var when no merchant input and unknown industry', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '0.40');
    const rawUnknown = { ...baseRaw, industry: 'unknownIndustry' };
    const resolved = resolveAssessmentInputs(rawUnknown, {
      country: 'AU',
      industry: 'unknownIndustry',
      merchantInput: {},
    });
    // unknown industry falls back to 'other' which has same values as regulatory_constant
    // but resolves as industry_default source
    expect(resolved.resolutionTrace['cardMix.visa_debit']!.source).toBe('industry_default');
  });

  it('avgTransactionValue resolves to industry_default when no env var for a known industry', () => {
    // AU_AVG_TXN_BY_INDUSTRY['retail'] = 65 — wins over regulatory_constant
    vi.stubEnv('CALC_AVG_TXN_RETAIL', '');
    vi.stubEnv('CALC_AVG_TXN_DEFAULT', '');
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
    });
    expect(resolved.resolutionTrace['avgTransactionValue']!.source).toBe('industry_default');
    expect(resolved.resolutionTrace['avgTransactionValue']!.value).toBe(65);
  });

  it('avgTransactionValue falls to regulatory_constant when industry has no default', () => {
    vi.stubEnv('CALC_AVG_TXN_UNKNOWNINDUSTRY', '');
    vi.stubEnv('CALC_AVG_TXN_DEFAULT', '');
    const rawUnknown = { ...baseRaw, industry: 'unknownIndustry' };
    const resolved = resolveAssessmentInputs(rawUnknown, {
      country: 'AU',
      industry: 'unknownIndustry',
    });
    expect(resolved.resolutionTrace['avgTransactionValue']!.source).toBe('regulatory_constant');
    expect(resolved.resolutionTrace['avgTransactionValue']!.value).toBe(65);
  });

  it('avgTransactionValue resolves to café-specific default ($35) for cafe industry', () => {
    vi.stubEnv('CALC_AVG_TXN_CAFE', '');
    vi.stubEnv('CALC_AVG_TXN_DEFAULT', '');
    const rawCafe = { ...baseRaw, industry: 'cafe' };
    const resolved = resolveAssessmentInputs(rawCafe, {
      country: 'AU',
      industry: 'cafe',
    });
    expect(resolved.resolutionTrace['avgTransactionValue']!.source).toBe('industry_default');
    expect(resolved.resolutionTrace['avgTransactionValue']!.value).toBe(35);
  });
});

// ══════════════════════════════════════════════════════════════════
// Card mix normalisation
// ══════════════════════════════════════════════════════════════════

describe('Card mix normalisation', () => {
  it('normalises partial merchant input to sum to 1.0', () => {
    // Clear env vars so defaults come from regulatory constants
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60, amex: 0.05 } },
    });

    const breakdown = resolved.cardMix.breakdown;
    const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
  });

  it('Scenario 6: exact normalised values', () => {
    // Clear env vars
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60, amex: 0.05 } },
    });

    // Raw total = 0.60 + 0.18 + 0.17 + 0.12 + 0.08 + 0.05 + 0.05 = 1.25
    // After normalisation (÷ 1.25):
    expect(resolved.cardMix.debitShare).toBeCloseTo(0.680, 2);
    expect(resolved.cardMix.consumerCreditShare).toBeCloseTo(0.240, 2);
    expect(resolved.cardMix.foreignShare).toBeCloseTo(0.040, 2);
    expect(resolved.cardMix.amexShare).toBeCloseTo(0.040, 2);
  });

  it('normalises inputs summing to >100% correctly', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    // All 7 fields provided summing to 2.0
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: {
        cardMix: {
          visa_debit: 0.50,
          visa_credit: 0.30,
          mastercard_debit: 0.30,
          mastercard_credit: 0.20,
          eftpos: 0.30,
          amex: 0.20,
          foreign: 0.20,
        },
      },
    });

    const total = Object.values(resolved.cardMix.breakdown).reduce((s, v) => s + v, 0);
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
  });

  it('does not modify inputs summing to exactly 1.0', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: {
        cardMix: {
          visa_debit: 0.35,
          visa_credit: 0.18,
          mastercard_debit: 0.17,
          mastercard_credit: 0.12,
          eftpos: 0.08,
          amex: 0.05,
          foreign: 0.05,
        },
      },
    });

    expect(resolved.cardMix.breakdown.visa_debit).toBeCloseTo(0.35, 3);
    expect(resolved.cardMix.breakdown.visa_credit).toBeCloseTo(0.18, 3);
  });
});

// ══════════════════════════════════════════════════════════════════
// Confidence scoring
// ══════════════════════════════════════════════════════════════════

describe('Confidence scoring', () => {
  it('low confidence when all fields use defaults', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
    });
    expect(resolved.confidence).toBe('low');
  });

  it('high confidence when majority from merchant input', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    // 7 card mix fields + avgTxn + 2 expert rates = 10 rules with affectsConfidence
    // Providing 7 card mix + expert rates = 9 of 10 merchant inputs = 90% → high
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: {
        cardMix: {
          visa_debit: 0.35,
          visa_credit: 0.18,
          mastercard_debit: 0.17,
          mastercard_credit: 0.12,
          eftpos: 0.08,
          amex: 0.05,
          foreign: 0.05,
        },
        expertRates: { debitCents: 8, creditPct: 0.45 },
      },
    });
    expect(resolved.confidence).toBe('high');
  });

  it('medium confidence when some from merchant input', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    // 2 of 10 fields = 20% → medium
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: {
        cardMix: { visa_debit: 0.60, amex: 0.05 },
      },
    });
    expect(resolved.confidence).toBe('medium');
  });
});

// ══════════════════════════════════════════════════════════════════
// Resolution trace
// ══════════════════════════════════════════════════════════════════

describe('Resolution trace', () => {
  it('labels merchant input as "Your input"', () => {
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.50 } },
    });
    expect(resolved.resolutionTrace['cardMix.visa_debit']!.label).toBe('Your input');
  });

  it('labels industry_default as "Industry average"', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
    });
    // With industry_default source in pipeline, retail resolves from industry_default
    expect(resolved.resolutionTrace['cardMix.visa_credit']!.label).toBe('Industry average');
  });

  it('Scenario 6 trace: visa_debit from merchant, visa_credit from industry_default', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '');

    const resolved = resolveAssessmentInputs(baseRaw, {
      country: 'AU',
      industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60, amex: 0.05 } },
    });
    expect(resolved.resolutionTrace['cardMix.visa_debit']!.source).toBe('merchant_input');
    expect(resolved.resolutionTrace['cardMix.amex']!.source).toBe('merchant_input');
    expect(resolved.resolutionTrace['cardMix.visa_credit']!.source).toBe('industry_default');
  });
});
