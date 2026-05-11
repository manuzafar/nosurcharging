import { describe, it, expect } from 'vitest';
import {
  PSP_PUBLISHED_RATES,
  type PspPublishedRate,
} from '../constants/psp-rates';

// Guards the M1 capability-flag expansion. Every PSP entry must declare
// the full set of additive flags introduced by
// RESULTS_CONTENT_CREDIBILITY_BRIEF.md so the action builder + benchmark
// helper can safely consume them without optional-chaining defensively.

const REQUIRED_KEYS: (keyof PspPublishedRate)[] = [
  'standardMsf',
  'planType',
  'offersItemisedPlan',
  'publishesMsfFromOct2026',
  'standardMsfIsListRate',
];

describe('PSP_PUBLISHED_RATES — capability flag coverage', () => {
  for (const [name, rate] of Object.entries(PSP_PUBLISHED_RATES)) {
    describe(name, () => {
      it.each(REQUIRED_KEYS)('declares %s', (key) => {
        expect(rate[key]).toBeDefined();
      });

      it('standardMsf is a sensible AU MSF (0% < x < 5%)', () => {
        expect(rate.standardMsf).toBeGreaterThan(0);
        expect(rate.standardMsf).toBeLessThan(0.05);
      });

      it('volume_gated PSPs disclose their threshold', () => {
        if (rate.offersItemisedPlan === 'volume_gated') {
          // "Other" is intentionally volume_gated without a numeric threshold —
          // unknown provider, can't pin a specific number. Stripe and Tyro must.
          if (name !== 'Other') {
            expect(rate.itemisedVolumeThresholdMonthly).toBeGreaterThan(0);
          }
        }
      });
    });
  }

  it('exposes the 11 PSPs the assessment + registry expect (10 selectable + NAB future-ready)', () => {
    // Step 2's PSP selector currently exposes 10 keys; NAB is registry-
    // only until the dropdown adds it.
    const keys = Object.keys(PSP_PUBLISHED_RATES).sort();
    expect(keys).toEqual(
      [
        'ANZ',
        'Adyen',
        'CommBank',
        'NAB',
        'Other',
        'Square',
        'Stripe',
        'Tyro',
        'Westpac',
        'Zeller',
        'eWAY',
      ].sort(),
    );
  });

  it('Stripe carries the fixed-fee component verified May 2026', () => {
    expect(PSP_PUBLISHED_RATES.Stripe!.fixedFeePerTxn).toBe(0.30);
  });

  it('bank acquirers + Adyen are NOT list-rate anchors', () => {
    expect(PSP_PUBLISHED_RATES.CommBank!.standardMsfIsListRate).toBe(false);
    expect(PSP_PUBLISHED_RATES.ANZ!.standardMsfIsListRate).toBe(false);
    expect(PSP_PUBLISHED_RATES.Westpac!.standardMsfIsListRate).toBe(false);
    expect(PSP_PUBLISHED_RATES.NAB!.standardMsfIsListRate).toBe(false);
    expect(PSP_PUBLISHED_RATES.Adyen!.standardMsfIsListRate).toBe(false);
  });

  it('Square + Zeller report no itemised plan availability', () => {
    expect(PSP_PUBLISHED_RATES.Square!.offersItemisedPlan).toBe('no');
    expect(PSP_PUBLISHED_RATES.Zeller!.offersItemisedPlan).toBe('no');
  });

  it('eWAY routes to underlying acquirer', () => {
    expect(PSP_PUBLISHED_RATES.eWAY!.offersItemisedPlan).toBe('gateway_only');
  });

  it('only acquirers above the RBA $10B threshold publish MSF from Oct 2026', () => {
    // Below-threshold: Stripe AU, Square AU, Zeller, eWAY.
    expect(PSP_PUBLISHED_RATES.Stripe!.publishesMsfFromOct2026).toBe(false);
    expect(PSP_PUBLISHED_RATES.Square!.publishesMsfFromOct2026).toBe(false);
    expect(PSP_PUBLISHED_RATES.Zeller!.publishesMsfFromOct2026).toBe(false);
    expect(PSP_PUBLISHED_RATES.eWAY!.publishesMsfFromOct2026).toBe(false);
    // Above-threshold: bank acquirers + Tyro + Adyen.
    expect(PSP_PUBLISHED_RATES.CommBank!.publishesMsfFromOct2026).toBe(true);
    expect(PSP_PUBLISHED_RATES.NAB!.publishesMsfFromOct2026).toBe(true);
    expect(PSP_PUBLISHED_RATES.Westpac!.publishesMsfFromOct2026).toBe(true);
    expect(PSP_PUBLISHED_RATES.ANZ!.publishesMsfFromOct2026).toBe(true);
    expect(PSP_PUBLISHED_RATES.Tyro!.publishesMsfFromOct2026).toBe(true);
    expect(PSP_PUBLISHED_RATES.Adyen!.publishesMsfFromOct2026).toBe(true);
  });
});
