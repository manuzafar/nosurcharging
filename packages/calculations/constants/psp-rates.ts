// packages/calculations/constants/psp-rates.ts
// Published PSP flat-rate MSF benchmarks (April 2026).
// Used to pre-fill the flat-rate MSF field in Step 2 after the merchant
// selects a PSP. These are list rates — the merchant may verify and update.
//
// Source: public pricing pages and product terms, April 2026.
// Update cadence: quarterly (or whenever a PSP amends pricing publicly).

export interface PspPublishedRate {
  /** Displayed MSF for a standard domestic in-person/online transaction. */
  standardMsf: number;
  /** Plan type this rate most commonly corresponds to. */
  planType: 'flat' | 'costplus' | 'blended';
  /** Free-text caveat rendered below the pre-filled field. */
  caveat?: string;
}

export const PSP_PUBLISHED_RATES: Record<string, PspPublishedRate> = {
  Stripe:   { standardMsf: 0.017,  planType: 'flat' },
  Square:   { standardMsf: 0.016,  planType: 'flat' },
  Tyro:     { standardMsf: 0.014,  planType: 'flat' },
  CommBank: { standardMsf: 0.0115, planType: 'flat' },
  ANZ:      { standardMsf: 0.011,  planType: 'flat' },
  Westpac:  { standardMsf: 0.011,  planType: 'flat' },
  Zeller:   { standardMsf: 0.014,  planType: 'flat' },
  eWAY:     { standardMsf: 0.014,  planType: 'flat' },
  Adyen:    { standardMsf: 0.012,  planType: 'costplus' },
  Other:    { standardMsf: 0.014,  planType: 'flat' },
};

export const PSP_RATES_AS_OF = 'April 2026';
