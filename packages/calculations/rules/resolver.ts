// packages/calculations/rules/resolver.ts
// Resolution pipeline — builds ResolvedAssessmentInputs by trying each source
// in priority order and taking the first non-null value.
//
// The calculation engine receives the output of this module.
// It never decides where values come from.

import { RULE_SCHEMA } from './schema';
import { AU_SCHEME_CARD_MIX_DEFAULTS, AU_INDUSTRY_CARD_MIX, AU_AVG_TXN_BY_INDUSTRY } from '../constants/au';
import type {
  RuleSource,
  ResolutionTrace,
  ResolvedCardMix,
  ResolvedAssessmentInputs,
  RawAssessmentData,
  ResolutionContext,
  Confidence,
  CardMixBreakdown,
} from '../types';

// ── Source resolution ────────────────────────────────────────────

interface SourceCandidate {
  source: RuleSource;
  value: number | null | undefined;
}

function resolveValue(
  ruleKey: string,
  sources: SourceCandidate[],
): { value: number; source: RuleSource } {
  for (const { source, value } of sources) {
    if (value !== null && value !== undefined && !isNaN(value)) {
      return { value, source };
    }
  }
  throw new Error(`No source resolved value for rule: ${ruleKey}`);
}

// ── Source labels ────────────────────────────────────────────────

function sourceLabel(source: RuleSource): string {
  const labels: Record<RuleSource, string> = {
    merchant_input: 'Your input',
    invoice_parsed: 'From your statement',
    industry_default: 'Industry average',
    env_var: 'RBA average',
    regulatory_constant: 'RBA average',
  };
  return labels[source];
}

// ── Env var parsing ──────────────────────────────────────────────

function parseEnvFloat(key: string): number | null {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return null;
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? null : parsed;
}

// ── Card mix resolution ──────────────────────────────────────────

function resolveCardMix(
  ctx: ResolutionContext,
  trace: ResolutionTrace,
): ResolvedCardMix {
  const merchantMix = ctx.merchantInput?.cardMix;
  const invoiceMix = ctx.invoiceParsed?.cardMix;

  // Industry defaults (priority 3 source — between invoice and env var)
  const industry = ctx.industry?.toLowerCase() ?? 'other';
  // 'other' always exists in AU_INDUSTRY_CARD_MIX — safe fallback
  const industryDefaults = (AU_INDUSTRY_CARD_MIX[industry] ?? AU_INDUSTRY_CARD_MIX['other'])!;

  // Resolve each scheme component with source priority
  const components = {
    visa_debit: resolveValue('cardMix.visa_debit', [
      { source: 'merchant_input', value: merchantMix?.visa_debit },
      { source: 'invoice_parsed', value: invoiceMix?.visa_debit },
      { source: 'industry_default', value: industryDefaults.visa_debit },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_VISA_DEBIT') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.visa_debit },
    ]),
    visa_credit: resolveValue('cardMix.visa_credit', [
      { source: 'merchant_input', value: merchantMix?.visa_credit },
      { source: 'invoice_parsed', value: invoiceMix?.visa_credit },
      { source: 'industry_default', value: industryDefaults.visa_credit },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_VISA_CREDIT') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.visa_credit },
    ]),
    mastercard_debit: resolveValue('cardMix.mastercard_debit', [
      { source: 'merchant_input', value: merchantMix?.mastercard_debit },
      { source: 'invoice_parsed', value: invoiceMix?.mastercard_debit },
      { source: 'industry_default', value: industryDefaults.mastercard_debit },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_MC_DEBIT') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.mastercard_debit },
    ]),
    mastercard_credit: resolveValue('cardMix.mastercard_credit', [
      { source: 'merchant_input', value: merchantMix?.mastercard_credit },
      { source: 'invoice_parsed', value: invoiceMix?.mastercard_credit },
      { source: 'industry_default', value: industryDefaults.mastercard_credit },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_MC_CREDIT') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.mastercard_credit },
    ]),
    eftpos: resolveValue('cardMix.eftpos', [
      { source: 'merchant_input', value: merchantMix?.eftpos },
      { source: 'invoice_parsed', value: invoiceMix?.eftpos },
      { source: 'industry_default', value: industryDefaults.eftpos },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_EFTPOS') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.eftpos },
    ]),
    amex: resolveValue('cardMix.amex', [
      { source: 'merchant_input', value: merchantMix?.amex },
      { source: 'invoice_parsed', value: invoiceMix?.amex },
      { source: 'industry_default', value: industryDefaults.amex },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_AMEX') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.amex },
    ]),
    foreign: resolveValue('cardMix.foreign', [
      { source: 'merchant_input', value: merchantMix?.foreign },
      { source: 'invoice_parsed', value: invoiceMix?.foreign },
      { source: 'industry_default', value: industryDefaults.foreign },
      { source: 'env_var', value: parseEnvFloat('CALC_CARD_MIX_FOREIGN') },
      { source: 'regulatory_constant', value: AU_SCHEME_CARD_MIX_DEFAULTS.foreign },
    ]),
  };

  // Build raw breakdown before normalisation
  const raw: CardMixBreakdown = {
    visa_debit: components.visa_debit.value,
    visa_credit: components.visa_credit.value,
    mastercard_debit: components.mastercard_debit.value,
    mastercard_credit: components.mastercard_credit.value,
    eftpos: components.eftpos.value,
    amex: components.amex.value,
    foreign: components.foreign.value,
    commercial: 0,
  };

  // Normalise to sum to 1.0
  const total = Object.values(raw).reduce((sum, v) => sum + v, 0);
  if (Math.abs(total - 1.0) > 0.001 && total > 0) {
    const keys = Object.keys(raw) as (keyof CardMixBreakdown)[];
    for (const k of keys) {
      raw[k] = raw[k] / total;
    }
  }

  // Record trace AFTER normalisation so trace values match what engine uses
  const traceKeys: (keyof typeof components)[] = [
    'visa_debit', 'visa_credit', 'mastercard_debit', 'mastercard_credit',
    'eftpos', 'amex', 'foreign',
  ];
  for (const key of traceKeys) {
    trace[`cardMix.${key}`] = {
      source: components[key].source,
      value: raw[key],
      label: sourceLabel(components[key].source),
    };
  }
  // Commercial has no merchant_input source in the Phase 1 card mix form —
  // always 0 from the regulatory default. Tracked so AssumptionsPanel can
  // render the CALC-04 copy advising B2B merchants to input their actual
  // commercial share via the RefinementPanel.
  trace['cardMix.commercial'] = {
    source: 'regulatory_constant',
    value: raw.commercial,
    label: sourceLabel('regulatory_constant'),
  };

  // Aggregate into the high-level shares the engine expects
  return {
    debitShare: raw.visa_debit + raw.mastercard_debit + raw.eftpos,
    consumerCreditShare: raw.visa_credit + raw.mastercard_credit,
    foreignShare: raw.foreign,
    amexShare: raw.amex,
    commercialShare: raw.commercial,
    breakdown: raw,
  };
}

// ── Confidence scoring ───────────────────────────────────────────
// Based on ratio of fields from merchant_input or invoice_parsed
// vs total fields that affectsConfidence.

function deriveConfidence(trace: ResolutionTrace): Confidence {
  const rules = RULE_SCHEMA.filter((r) => r.affectsConfidence);
  const merchantCount = rules.filter(
    (r) =>
      trace[r.key]?.source === 'merchant_input' ||
      trace[r.key]?.source === 'invoice_parsed',
  ).length;

  const ratio = merchantCount / rules.length;

  if (ratio >= 0.6) return 'high';
  if (ratio >= 0.2) return 'medium';
  return 'low';
}

// ── Main resolution function ─────────────────────────────────────

export function resolveAssessmentInputs(
  raw: RawAssessmentData,
  ctx: ResolutionContext,
): ResolvedAssessmentInputs {
  const trace: ResolutionTrace = {};

  // Resolve card mix
  const cardMix = resolveCardMix(ctx, trace);

  // Resolve average transaction value
  const avgTxnResolved = resolveValue('avgTransactionValue', [
    { source: 'merchant_input', value: ctx.merchantInput?.avgTransactionValue },
    { source: 'invoice_parsed', value: ctx.invoiceParsed?.avgTransactionValue },
    { source: 'env_var', value: parseEnvFloat(`CALC_AVG_TXN_${raw.industry.toUpperCase()}`) },
    { source: 'env_var', value: parseEnvFloat('CALC_AVG_TXN_DEFAULT') },
    { source: 'industry_default', value: AU_AVG_TXN_BY_INDUSTRY[raw.industry] ?? null },
    { source: 'regulatory_constant', value: 65 },
  ]);
  trace.avgTransactionValue = {
    source: avgTxnResolved.source,
    value: avgTxnResolved.value,
    label: sourceLabel(avgTxnResolved.source),
  };

  // Resolve expert interchange rates
  // Default debitCents = 9 (RBA current average), creditPct = 0.47 (RBA confirmed market average)
  // marginPct = 0.10 (10bps assumed PSP margin)
  const debitCents = resolveValue('expertRates.debitCents', [
    { source: 'merchant_input', value: ctx.merchantInput?.expertRates?.debitCents },
    { source: 'regulatory_constant', value: 9 },
  ]);
  const creditPct = resolveValue('expertRates.creditPct', [
    { source: 'merchant_input', value: ctx.merchantInput?.expertRates?.creditPct },
    { source: 'regulatory_constant', value: 0.47 },
  ]);
  const marginPct = resolveValue('expertRates.marginPct', [
    { source: 'merchant_input', value: ctx.merchantInput?.expertRates?.marginPct },
    { source: 'regulatory_constant', value: 0.10 },
  ]);

  trace['expertRates.debitCents'] = {
    source: debitCents.source,
    value: debitCents.value,
    label: sourceLabel(debitCents.source),
  };
  trace['expertRates.creditPct'] = {
    source: creditPct.source,
    value: creditPct.value,
    label: sourceLabel(creditPct.source),
  };
  trace['expertRates.marginPct'] = {
    source: marginPct.source,
    value: marginPct.value,
    label: sourceLabel(marginPct.source),
  };

  const confidence = deriveConfidence(trace);

  // Zero-cost: derive estimatedMSFRate from three-state msfRateMode
  let estimatedMSFRate: number | undefined;
  if (raw.planType === 'zero_cost') {
    const derivedMSF =
      raw.msfRateMode === 'market_estimate' ? 0.014
      : raw.msfRateMode === 'custom' && raw.customMSFRate ? raw.customMSFRate
      : undefined;
    const r = resolveValue('estimatedMSFRate', [
      { source: 'merchant_input',      value: derivedMSF },
      { source: 'regulatory_constant', value: 0.014 },
    ]);
    trace['estimatedMSFRate'] = { source: r.source, value: r.value, label: sourceLabel(r.source) };
    estimatedMSFRate = r.value;
  }

  // Blended: pass through rates from merchantInput.blendedRates
  let debitRate: number | undefined;
  let creditRate: number | undefined;
  if (raw.planType === 'blended') {
    debitRate  = ctx.merchantInput?.blendedRates?.debitRate;
    creditRate = ctx.merchantInput?.blendedRates?.creditRate;
  }

  // Normalise planType: strategic_rate should never reach here, but defensive
  const resolvedPlanType = raw.planType === 'strategic_rate' ? 'flat' as const : raw.planType;

  // Min monthly fee — merchant_input only (Phase 1). Trace recorded so
  // AssumptionsPanel / RefinementPanel know whether the floor was user-supplied.
  const minMonthlyFee = ctx.merchantInput?.minMonthlyFee;
  if (minMonthlyFee !== undefined && minMonthlyFee > 0) {
    trace['minMonthlyFee'] = {
      source: 'merchant_input',
      value: minMonthlyFee,
      label: sourceLabel('merchant_input'),
    };
  }

  return {
    volume: raw.volume,
    planType: resolvedPlanType,
    msfRate: raw.msfRate,
    surcharging: raw.surcharging,
    surchargeRate: raw.surchargeRate,
    surchargeNetworks: raw.surchargeNetworks,
    industry: raw.industry,
    psp: raw.psp,
    passThrough: raw.passThrough,
    cardMix,
    avgTransactionValue: avgTxnResolved.value,
    expertRates: {
      debitCents: debitCents.value,
      creditPct: creditPct.value,
      marginPct: marginPct.value,
    },
    resolutionTrace: trace,
    confidence,
    estimatedMSFRate,
    debitRate,
    creditRate,
    minMonthlyFee,
  };
}
