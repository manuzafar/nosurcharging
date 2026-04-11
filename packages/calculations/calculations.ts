// packages/calculations/calculations.ts
// Pure calculation engine. Receives ResolvedAssessmentInputs — no optionals,
// no nulls, no fallbacks. All input resolution happens upstream in the resolver.
//
// Formulas from docs/product/calculation-verification.md (ground truth).
// If this engine disagrees with those numbers, this engine is wrong.

import { getCategory } from './categories';
import { getRatesForPeriod, getCurrentPeriod } from './periods';
import { AU_SCHEME_FEES, AU_DEBIT_PCT_RATES, ZERO_COST_MSF_RANGE } from './constants/au';
import type { ResolvedAssessmentInputs, AssessmentOutputs, ZeroCostOutputs } from './types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateMetrics(
  inputs: ResolvedAssessmentInputs,
  now: Date = new Date(),
): AssessmentOutputs {
  const { volume, planType, surcharging, surchargeRate, passThrough, msfRate } = inputs;
  const { cardMix, avgTransactionValue, expertRates } = inputs;

  const category = getCategory(planType, surcharging);
  const period = getCurrentPeriod(now);
  const { current: currentRates, projected: projectedRates } = getRatesForPeriod(now);

  // ── Current rates (from expert input or RBA defaults) ──────────
  // expertRates.debitCents is in cents (e.g. 9)
  // expertRates.creditPct is in percentage points (e.g. 0.52 meaning 0.52%)
  const currentDebitCentsPerTxn = expertRates.debitCents / 100; // convert to dollars
  const currentCreditPct = expertRates.creditPct / 100; // convert to proportion
  const marginPct = expertRates.marginPct / 100; // convert to proportion

  // ── Projected rates (reform caps applied) ──────────────────────
  // If merchant's current rate is already below the cap, projected = current (no saving)
  const projectedDebitCentsPerTxn = projectedRates
    ? Math.min(expertRates.debitCents, projectedRates.debitCentsPerTxn * 100) / 100
    : currentDebitCentsPerTxn;

  const projectedCreditPct = projectedRates
    ? Math.min(currentCreditPct, projectedRates.consumerCreditPct)
    : currentCreditPct;

  // ── Debit IC saving ────────────────────────────────────────────
  // visaMcDebitTxns: used ONLY for the saving calculation.
  // eftpos (~$0.02/txn) is already below the 8c reform cap — no saving from reform.
  const visaMcDebitShare = cardMix.breakdown.visa_debit + cardMix.breakdown.mastercard_debit;
  const visaMcDebitTxns = (volume * visaMcDebitShare) / avgTransactionValue;

  // "Lower of" rule: interchange = MIN(cents per txn, pct rate × ATV)
  const currentDebitICPerTxn = Math.min(
    currentDebitCentsPerTxn,
    AU_DEBIT_PCT_RATES.preSep2026 * avgTransactionValue,
  );
  const projectedDebitICPerTxn = projectedRates
    ? Math.min(projectedDebitCentsPerTxn, AU_DEBIT_PCT_RATES.postOct2026 * avgTransactionValue)
    : currentDebitICPerTxn;

  const debitSaving = Math.max(0, round2(
    visaMcDebitTxns * (currentDebitICPerTxn - projectedDebitICPerTxn),
  ));

  // allDebitTxns: used for debitIC in grossCOA (full share including eftpos).
  // grossCOA must remain unchanged — debitIC still uses 0.60.
  const allDebitTxns = (volume * cardMix.debitShare) / avgTransactionValue;

  // ── Credit IC saving ───────────────────────────────────────────
  const creditSaving = round2(volume * cardMix.consumerCreditShare * (currentCreditPct - projectedCreditPct));

  // ── Total IC saving ────────────────────────────────────────────
  const icSaving = round2(debitSaving + creditSaving);

  // ── Scheme fees (invariant: identical both periods) ────────────
  const todayScheme = round2(volume * AU_SCHEME_FEES.domesticPct);
  const oct2026Scheme = todayScheme; // INVARIANT: scheme fees are unregulated, unchanged

  // ── Intermediate values (always computed, returned in outputs) ──
  const debitIC = round2(allDebitTxns * currentDebitCentsPerTxn);
  const creditIC = round2(volume * cardMix.consumerCreditShare * currentCreditPct);
  const pspMargin = round2(volume * marginPct);
  const grossCOA = round2(debitIC + creditIC + todayScheme + pspMargin);
  // ── Blended rate: weighted effective MSF rate ───────────────────
  const effectiveMSFRate = (() => {
    if (
      planType !== 'blended'
      || inputs.debitRate === undefined
      || inputs.creditRate === undefined
    ) {
      return msfRate;
    }
    // debitShare (0.60): blended rate covers ALL debit (Visa, MC, eftpos)
    // unknownShare: Amex, foreign, commercial — use msfRate as proxy
    const unknownShare = Math.max(0, 1 - cardMix.debitShare - cardMix.consumerCreditShare);
    // NO round2() here — rates must not be rounded (0.01235 → 0.01 is a 19% error)
    return (
      inputs.debitRate  * cardMix.debitShare
      + inputs.creditRate * cardMix.consumerCreditShare
      + msfRate           * unknownShare
    );
  })();
  // round2() applied only to the dollar amount:
  const annualMSF = round2(volume * effectiveMSFRate);

  // ── Surcharge revenue (actual card mix designated share) ───────
  // Map each surcharged network to its card mix breakdown share.
  // Empty surchargeNetworks with surcharging=true defaults to all designated
  // networks — backward-compatible with Scenarios 3/4 (which use []).
  const networksToApply: string[] =
    inputs.surcharging && inputs.surchargeNetworks.length === 0
      ? ['visa', 'mastercard', 'eftpos']  // default: all designated
      : inputs.surchargeNetworks;

  let designatedSurchargeShare = 0;
  if (inputs.surcharging) {
    const { breakdown } = cardMix;
    if (networksToApply.includes('visa')) {
      designatedSurchargeShare += breakdown.visa_debit + breakdown.visa_credit;
    }
    if (networksToApply.includes('mastercard')) {
      designatedSurchargeShare += breakdown.mastercard_debit + breakdown.mastercard_credit;
    }
    if (networksToApply.includes('eftpos')) {
      designatedSurchargeShare += breakdown.eftpos;
    }
    // amex, bnpl, paypal: not designated — excluded from ban
  }

  const surchargeRevenue = round2(volume * surchargeRate * designatedSurchargeShare);

  // ── P&L calculation by plan type ───────────────────────────────
  let netToday: number;
  let octNet: number;

  if (planType === 'costplus') {
    netToday = round2(grossCOA - surchargeRevenue);
    octNet = round2(grossCOA - icSaving);
  } else {
    // flat and blended both use annualMSF
    netToday = round2(annualMSF - surchargeRevenue);
    octNet = round2(annualMSF - round2(icSaving * passThrough));
  }

  const plSwing = round2(netToday - octNet);

  // ── Range computation ──────────────────────────────────────────
  let plSwingLow: number;
  let plSwingHigh: number;
  let rangeDriver: AssessmentOutputs['rangeDriver'];
  let rangeNote: string;

  if (planType === 'flat' || planType === 'blended') {
    // Range is pass-through uncertainty (does NOT reference passThrough)
    if (surcharging) {
      const netTodayFlat = round2(annualMSF - surchargeRevenue);
      plSwingLow  = round2(netTodayFlat - annualMSF);            // 0% PT
      plSwingHigh = round2(netTodayFlat - (annualMSF - icSaving)); // 100% PT
    } else {
      plSwingLow  = 0;
      plSwingHigh = icSaving;
    }
    rangeDriver = 'pass_through';
    rangeNote   = 'Range shows 0% to 100% PSP pass-through. The RBA estimates ~45% average.';
  } else {
    // Cost-plus: range is card mix accuracy (±20%)
    const lowIC  = round2(icSaving * 0.80);
    const highIC = round2(icSaving * 1.20);
    plSwingLow  = surcharging ? round2(lowIC  - surchargeRevenue) : lowIC;
    plSwingHigh = surcharging ? round2(highIC - surchargeRevenue) : highIC;
    rangeDriver = 'card_mix';
    rangeNote   = 'Range reflects ±20% card mix accuracy. Enter your actual card mix to narrow it.';
  }

  return {
    category,
    icSaving,
    debitSaving,
    creditSaving,
    todayInterchange: round2(debitIC + creditIC),
    todayMargin: pspMargin,
    grossCOA,
    annualMSF,
    surchargeRevenue,
    netToday,
    octNet,
    plSwing,
    plSwingLow,
    plSwingHigh,
    rangeDriver,
    rangeNote,
    todayScheme,
    oct2026Scheme,
    confidence: inputs.confidence,
    period,
  };
}

export function calculateZeroCostMetrics(
  inputs: ResolvedAssessmentInputs,
  now: Date = new Date(),
): ZeroCostOutputs {
  const { volume } = inputs;
  const effectiveRate = inputs.estimatedMSFRate ?? ZERO_COST_MSF_RANGE.default;
  return {
    modelType:        'zero_cost',
    preReformNetCost: 0,
    postReformNetCost: round2(volume * effectiveRate),
    reformImpact:     round2(volume * effectiveRate),
    plSwingLow:       round2(volume * ZERO_COST_MSF_RANGE.low),
    plSwing:          round2(volume * effectiveRate),
    plSwingHigh:      round2(volume * ZERO_COST_MSF_RANGE.high),
    rangeDriver:      'post_reform_rate',
    rangeNote:        'Range shows 1.2%–1.6% post-reform rate scenarios. Centre uses RBA 1.4% benchmark.',
    estimatedMSFRate: effectiveRate,
    confidence:       'directional',
    urgency:          'critical',
    period:           getCurrentPeriod(now),
  };
}
