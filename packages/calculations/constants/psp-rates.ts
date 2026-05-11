// packages/calculations/constants/psp-rates.ts
// Published PSP flat-rate MSF benchmarks + capability flags (May 2026).
//
// Two responsibilities:
//   1. Pre-fill the flat-rate MSF field in Step 2 once a PSP is selected
//      (existing behaviour — driven by `standardMsf`).
//   2. Drive PSP-aware action generation and the new market-benchmark
//      sentence on the results page (RESULTS_CONTENT_CREDIBILITY_BRIEF.md).
//      The added flags surface which PSPs actually offer an itemised
//      (interchange-plus) plan, which acquirers must publish their MSFs
//      under the RBA's October 2026 reform, and which "standard MSF"
//      values are meaningful list rates worth benchmarking against.
//
// All values verified May 2026 against each PSP's public pricing pages.
// Update cadence: quarterly (or whenever a PSP amends pricing publicly).

export interface PspPublishedRate {
  /** Displayed MSF for a standard domestic in-person/online transaction. */
  standardMsf: number;
  /** Optional fixed component per transaction (AUD). Stripe: 0.30. */
  fixedFeePerTxn?: number;
  /** Plan type this rate most commonly corresponds to. */
  planType: 'flat' | 'costplus' | 'blended';
  /**
   * Whether this PSP offers an itemised (cost-plus / IC++) plan at any
   * tier. `volume_gated` PSPs only expose it above a monthly card-volume
   * threshold; `gateway_only` PSPs (eWAY) inherit pricing from the
   * underlying acquirer.
   */
  offersItemisedPlan: 'yes' | 'no' | 'volume_gated' | 'gateway_only';
  /** Minimum monthly card volume required to access itemised pricing, if volume-gated. */
  itemisedVolumeThresholdMonthly?: number;
  /**
   * Whether this acquirer must publish quarterly MSF data from
   * 30 October 2026. RBA threshold is >$10 billion AU card volume
   * annually — Stripe AU, Square AU, Zeller and eWAY fall below.
   */
  publishesMsfFromOct2026: boolean;
  /**
   * Whether `standardMsf` is a meaningful list rate that can anchor the
   * results-page benchmark sentence. False for bank acquirers
   * (negotiated only) and Adyen (cost-plus only).
   */
  standardMsfIsListRate: boolean;
  /** Free-text caveat rendered below the pre-filled field in Step 2. */
  caveat?: string;
}

export const PSP_PUBLISHED_RATES: Record<string, PspPublishedRate> = {
  Stripe: {
    standardMsf: 0.0175,
    fixedFeePerTxn: 0.30,
    planType: 'flat',
    offersItemisedPlan: 'volume_gated',
    itemisedVolumeThresholdMonthly: 20833, // ~$250K/yr international volume floor
    publishesMsfFromOct2026: false,
    standardMsfIsListRate: true,
  },
  Square: {
    standardMsf: 0.016,
    planType: 'flat',
    offersItemisedPlan: 'no',
    publishesMsfFromOct2026: false,
    standardMsfIsListRate: true,
    caveat: 'Card-present rate. Online/MOTO transactions charged at 2.2%.',
  },
  Tyro: {
    standardMsf: 0.014,
    planType: 'flat',
    offersItemisedPlan: 'volume_gated',
    itemisedVolumeThresholdMonthly: 20000,
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: true,
  },
  CommBank: {
    standardMsf: 0.0115,
    planType: 'flat',
    offersItemisedPlan: 'yes',
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: false,
    caveat: 'Bank acquirer rate. Negotiated above stated tier thresholds.',
  },
  ANZ: {
    standardMsf: 0.011,
    planType: 'flat',
    offersItemisedPlan: 'yes',
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: false,
    caveat: 'ANZ Worldline. Bank acquirer rate; negotiated at scale.',
  },
  Westpac: {
    standardMsf: 0.014,
    planType: 'flat',
    offersItemisedPlan: 'yes',
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: false,
    caveat: 'Bank acquirer rate; current 0% promo until 30 June 2026.',
  },
  NAB: {
    standardMsf: 0.0115,
    planType: 'flat',
    offersItemisedPlan: 'yes',
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: false,
    caveat: 'Bank acquirer rate. NAB Easy Tap is 1.40%.',
  },
  Zeller: {
    standardMsf: 0.014,
    planType: 'flat',
    offersItemisedPlan: 'no',
    publishesMsfFromOct2026: false,
    standardMsfIsListRate: true,
    caveat: 'GST-inclusive rate.',
  },
  eWAY: {
    standardMsf: 0.014,
    planType: 'flat',
    offersItemisedPlan: 'gateway_only',
    publishesMsfFromOct2026: false,
    standardMsfIsListRate: true,
    caveat: 'Gateway only — pricing dictated by underlying acquirer.',
  },
  Adyen: {
    standardMsf: 0.012,
    planType: 'costplus',
    offersItemisedPlan: 'yes',
    publishesMsfFromOct2026: true,
    standardMsfIsListRate: false,
    caveat: 'Interchange-plus from ~0.60% acquirer markup. Typical $500K+/month minimum.',
  },
  Other: {
    standardMsf: 0.014,
    planType: 'flat',
    offersItemisedPlan: 'volume_gated',
    publishesMsfFromOct2026: false,
    standardMsfIsListRate: false,
    caveat: 'Unknown provider — rate is an industry-average estimate.',
  },
};

export const PSP_RATES_AS_OF = 'May 2026';
