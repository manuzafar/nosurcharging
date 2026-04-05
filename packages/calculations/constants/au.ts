// packages/calculations/constants/au.ts
// Australian interchange rates, reform dates, and card mix defaults.
// Source: RBA Conclusions Paper, March 2026.
// Store all rates here ONLY — never hardcode elsewhere.

import type {
  InterchangeRates,
  SchemeFees,
  CardMixDefaults,
  ReformDates,
} from '../types';

// ── Reform dates ─────────────────────────────────────────────────
// All dates stored as ISO strings. Comparisons use UTC midnight.

export const AU_REFORM_DATES: ReformDates = {
  surchargeBan: '2026-10-01',
  domesticICCuts: '2026-10-01',
  foreignCardCap: '2027-04-01',
  msfPublication: '2026-10-30',
  passThroughReport: '2027-01-30',
};

// ── Interchange rates by period ──────────────────────────────────
// Source: RBA Conclusions Paper, March 2026

export const AU_INTERCHANGE = {
  // Current rates (pre-October 2026)
  preSep2026: {
    debitCentsPerTxn: 0.09, // 9 cents per transaction
    consumerCreditPct: 0.0052, // 0.52%
    commercialCreditPct: 0.008, // 0.80%
    foreignPct: 0.028, // 2.80%
  } satisfies InterchangeRates,

  // Post 1 October 2026
  postOct2026: {
    debitCentsPerTxn: 0.08, // 8c (lower of 8c or 0.16%)
    consumerCreditPct: 0.003, // 0.30%
    commercialCreditPct: 0.008, // unchanged
    foreignPct: 0.028, // unchanged until Apr 2027
  } satisfies InterchangeRates,

  // Post 1 April 2027
  // Only foreignPct changes. All other rates same as postOct2026.
  postApr2027: {
    debitCentsPerTxn: 0.08, // unchanged from Oct 2026
    consumerCreditPct: 0.003, // unchanged from Oct 2026
    commercialCreditPct: 0.008, // unchanged
    foreignPct: 0.01, // 1.0% IC cap ONLY — true floor ~2.58% with scheme fees
  } satisfies InterchangeRates,
} as const;

// ── Scheme fees (unregulated, unchanged by reform) ───────────────

export const AU_SCHEME_FEES: SchemeFees = {
  domesticPct: 0.00105, // 10.5bps
  crossBorderPct: 0.0158, // 158bps
};

// ── Default card mix ─────────────────────────────────────────────
// Source: RBA Statistical Tables C1 (Credit and Charge Cards) and
//         C2 (Debit Cards), 12 months to January 2026.
// URL: https://www.rba.gov.au/statistics/tables/#payments-system

export const AU_CARD_MIX_DEFAULTS: CardMixDefaults = {
  debitShare: 0.6, // ~63% rounded to 60%
  consumerCreditShare: 0.35, // ~35%
  foreignShare: 0.05, // ~5% (from RBA Conclusions Paper cross-border data)
  commercialShare: 0.0, // ~2-3% rounded to 0% for defaults
  avgTransactionValue: 65, // AUD
};

// ── Scheme-level card mix defaults ───────────────────────────────
// Used when granular scheme-level env vars are not set.
// These sum to 1.0.

export const AU_SCHEME_CARD_MIX_DEFAULTS = {
  visa_debit: 0.35,
  visa_credit: 0.18,
  mastercard_debit: 0.17,
  mastercard_credit: 0.12,
  eftpos: 0.08,
  amex: 0.05,
  foreign: 0.05,
  commercial: 0.0,
} as const;

// ── Average transaction values by industry ───────────────────────

export const AU_AVG_TXN_BY_INDUSTRY: Record<string, number> = {
  cafe: 35,
  hospitality: 80,
  retail: 65,
  online: 95,
  ticketing: 120,
  other: 65,
};

// ── Network classifications ──────────────────────────────────────

export const AU_DESIGNATED_NETWORKS = ['visa', 'mastercard', 'eftpos'] as const;
export const AU_EXEMPT_NETWORKS = ['amex', 'bnpl', 'paypal'] as const;
