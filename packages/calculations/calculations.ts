// packages/calculations/calculations.ts
// Pure calculation engine. Receives ResolvedAssessmentInputs — no optionals,
// no nulls, no fallbacks. All input resolution happens upstream in the resolver.
//
// Formulas from docs/product/calculation-verification.md (ground truth).
// If this engine disagrees with those numbers, this engine is wrong.

import { getCategory } from './categories';
import { getRatesForPeriod, getCurrentPeriod } from './periods';
import { AU_SCHEME_FEES } from './constants/au';
import type { ResolvedAssessmentInputs, AssessmentOutputs } from './types';

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
  const debitTxns = (volume * cardMix.debitShare) / avgTransactionValue;
  const debitSaving = Math.max(0, round2(debitTxns * (currentDebitCentsPerTxn - projectedDebitCentsPerTxn)));

  // ── Credit IC saving ───────────────────────────────────────────
  const creditSaving = round2(volume * cardMix.consumerCreditShare * (currentCreditPct - projectedCreditPct));

  // ── Total IC saving ────────────────────────────────────────────
  const icSaving = round2(debitSaving + creditSaving);

  // ── Scheme fees (invariant: identical both periods) ────────────
  const todayScheme = round2(volume * AU_SCHEME_FEES.domesticPct);
  const oct2026Scheme = todayScheme; // INVARIANT: scheme fees are unregulated, unchanged

  // ── P&L calculation by plan type ───────────────────────────────
  let netToday: number;
  let octNet: number;

  if (planType === 'costplus') {
    // Cost-plus: merchant pays actual wholesale cost + margin
    // grossCOA = debitIC + creditIC + schemeFees + pspMargin
    const debitIC = round2(debitTxns * currentDebitCentsPerTxn);
    const creditIC = round2(volume * cardMix.consumerCreditShare * currentCreditPct);
    const pspMargin = round2(volume * marginPct);
    const grossCOA = round2(debitIC + creditIC + todayScheme + pspMargin);

    const surchargeRevenue = round2(volume * surchargeRate);

    netToday = round2(grossCOA - surchargeRevenue);
    octNet = round2(grossCOA - icSaving);
  } else {
    // Flat rate: merchant pays blended MSF percentage
    const annualMSF = round2(volume * msfRate);
    const surchargeRevenue = round2(volume * surchargeRate);

    netToday = round2(annualMSF - surchargeRevenue);
    octNet = round2(annualMSF - round2(icSaving * passThrough));
  }

  const plSwing = round2(netToday - octNet);

  return {
    category,
    icSaving,
    debitSaving,
    creditSaving,
    netToday,
    octNet,
    plSwing,
    todayScheme,
    oct2026Scheme,
    confidence: inputs.confidence,
    period,
  };
}
