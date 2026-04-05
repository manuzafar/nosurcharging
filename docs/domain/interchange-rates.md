# Interchange Rate Constants

All values from RBA Conclusions Paper, March 2026.
Store in packages/calculations/constants/au.ts ONLY — never hardcode elsewhere.

## TypeScript constants for au.ts

```typescript
export const AU_REFORM_DATES = {
  surchargeBan:       '2026-10-01',
  domesticICCuts:     '2026-10-01',
  foreignCardCap:     '2027-04-01',
  msfPublication:     '2026-10-30',
  passThroughReport:  '2027-01-30',
} as const;

export const AU_INTERCHANGE = {
  current: {
    debitCentsPerTxn:    0.09,
    consumerCreditPct:   0.0052,
    commercialCreditPct: 0.008,
    foreignPct:          0.028,
  },
  oct2026: {
    debitCentsPerTxn:    0.08,   // 8c (or 0.16% lower of)
    consumerCreditPct:   0.003,  // 0.30%
    commercialCreditPct: 0.008,  // unchanged
    foreignPct:          0.028,  // unchanged until Apr 2027
  },
  apr2027: {
    foreignPct: 0.01, // IC cap only — true floor ~2.58% with scheme fees
  },
} as const;

export const AU_SCHEME_FEES = {
  domesticPct:    0.00105, // 10.5bps — unregulated
  crossBorderPct: 0.0158,  // 158bps — unregulated
} as const;

export const AU_CARD_MIX_DEFAULTS = {
  // Source: RBA Statistical Tables C1 (Credit and Charge Cards) and C2 (Debit Cards)
  // URL: https://www.rba.gov.au/statistics/tables/#payments-system (OQ-01)
  debitShare:          0.60,
  consumerCreditShare: 0.35,
  foreignShare:        0.05,
  commercialShare:     0.00,
  avgTransactionValue: 65, // AUD
} as const;
```

## Savings formulas

```typescript
// Debit saving: 9c → 8c = 1c per transaction
const debitTxns = (volume * cardMix.debitShare) / avgTxnValue;
const debitSaving = debitTxns * 0.01;

// Credit saving: 0.52% → 0.30% = 0.22% of credit volume
const creditSaving = volume * cardMix.consumerCreditShare * 0.0022;

const totalICSaving = debitSaving + creditSaving;
```

## Important: foreign card cost floor

The 1.0% April 2027 cap is on interchange ONLY. Scheme fees of ~1.58% are unregulated and added on top. Always present the true floor (~2.58%) not the capped interchange rate alone.
