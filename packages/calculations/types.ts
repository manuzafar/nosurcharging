// packages/calculations/types.ts
// All type definitions for the calculation engine and business rules engine.
// No logic — interfaces only.

// ── Reform periods ───────────────────────────────────────────────

export type ReformPeriod = 'pre_reform' | 'post_oct_2026' | 'post_apr_2027';

// ── Interchange rates ────────────────────────────────────────────

export interface InterchangeRates {
  debitCentsPerTxn: number;
  consumerCreditPct: number;
  commercialCreditPct: number;
  foreignPct: number;
}

export interface SchemeFees {
  domesticPct: number;
  crossBorderPct: number;
}

// ── Rate pair (current vs projected) ─────────────────────────────

export interface RatePair {
  current: InterchangeRates;
  projected: InterchangeRates | null;
  periodLabel: {
    current: string;
    projected: string | null;
  };
}

// ── Card mix ─────────────────────────────────────────────────────

export interface CardMixBreakdown {
  visa_debit: number;
  visa_credit: number;
  mastercard_debit: number;
  mastercard_credit: number;
  eftpos: number;
  amex: number;
  foreign: number;
  commercial: number;
}

export interface ResolvedCardMix {
  debitShare: number;
  consumerCreditShare: number;
  foreignShare: number;
  amexShare: number;
  commercialShare: number;
  breakdown: CardMixBreakdown;
}

export interface CardMixDefaults {
  debitShare: number;
  consumerCreditShare: number;
  foreignShare: number;
  commercialShare: number;
  avgTransactionValue: number;
}

// ── Expert rates ─────────────────────────────────────────────────

export interface ExpertRates {
  debitCents: number;
  creditPct: number;
  marginPct: number;
}

// ── Resolution trace ─────────────────────────────────────────────

export type RuleSource =
  | 'merchant_input'
  | 'invoice_parsed'
  | 'industry_default'
  | 'env_var'
  | 'regulatory_constant';

export interface ResolutionTraceEntry {
  source: RuleSource;
  value: number;
  label: string;
}

export interface ResolutionTrace {
  [ruleKey: string]: ResolutionTraceEntry;
}

// ── Confidence ───────────────────────────────────────────────────

export type Confidence = 'high' | 'medium' | 'low';

// ── Resolved assessment inputs ───────────────────────────────────
// This is what the calculation engine receives.
// No optionals. No nulls. No fallbacks. Everything populated.

export interface ResolvedAssessmentInputs {
  volume: number;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  surchargeNetworks: string[];
  industry: string;
  psp: string;
  passThrough: number;
  cardMix: ResolvedCardMix;
  avgTransactionValue: number;
  expertRates: ExpertRates;
  resolutionTrace: ResolutionTrace;
  confidence: Confidence;
  // strategic_rate never reaches the engine — intercepted in submitAssessment.ts
  // Cat 5 routing flag — true iff planType === 'zero_cost'. Engine reads this
  // first to gate the Cat 5 P&L branch (ignores surcharging/passThrough/
  // surchargeRate). Optional during phased rollout; resolver populates it.
  isZeroCost?: boolean;
  estimatedMSFRate?: number;  // zero-cost: resolved post-reform rate
  debitRate?: number;         // blended: debit rate as proportion (e.g. 0.009)
  creditRate?: number;        // blended: credit rate as proportion (e.g. 0.018)
  // Minimum monthly fee (flat-rate merchants only). If set, annualMSF is
  // floored at minMonthlyFee × 12 — low-volume merchants on a minimum-fee
  // contract don't benefit as much from rate cuts.
  minMonthlyFee?: number;
}

// ── Assessment outputs ───────────────────────────────────────────

export interface AssessmentOutputs {
  category: 1 | 2 | 3 | 4 | 5;
  icSaving: number;
  debitSaving: number;
  creditSaving: number;
  todayInterchange: number;
  todayMargin: number;
  grossCOA: number;
  annualMSF: number;
  surchargeRevenue: number;
  netToday: number;
  octNet: number;
  plSwing: number;
  plSwingLow: number;   // Cat2/blended: 0%PT. Costplus: icSaving×0.80. Cat5: −volume×0.016. Fixed at submission.
  plSwingHigh: number;  // Cat2/blended: 100%PT. Costplus: icSaving×1.20. Cat5: −volume×0.012. Fixed at submission.
  rangeDriver: 'pass_through' | 'card_mix' | 'post_reform_rate';
  rangeNote: string;
  todayScheme: number;
  oct2026Scheme: number;
  confidence: Confidence;
  period: ReformPeriod;
  // Cat 5 only — resolved post-reform flat rate (e.g. 0.014 for 1.4%).
  // Echoed from ResolvedAssessmentInputs.estimatedMSFRate so MetricCards
  // can render it without re-reading the trace. Optional for Cat 1-4.
  estimatedMSFRate?: number;
}

// ── Strategic rate detection ─────────────────────────────────────

export interface StrategicRateDetection {
  detected: boolean;
  triggerReason: 'self_reported' | null;
}

// ── Action list ──────────────────────────────────────────────────

export type ActionPriority = 'urgent' | 'plan' | 'monitor';

export interface ActionItem {
  priority: ActionPriority;
  timeAnchor: string;
  // What — the instruction (e.g. "Ask Stripe whether your rate will change")
  text: string;
  // Script — verbatim words to say (italic, paper bg, accent-border-left)
  // Optional because not every legacy/test caller provides one.
  script?: string;
  // Why — short explanation rendered below the script in ink-faint.
  why?: string;
}

// Runtime context the action builder needs to interpolate spec placeholders
// ([PSP], [volume], [rate], $X) into the script + what copy.
// Sourced from formData + AssessmentOutputs at the call site.
export interface ActionContext {
  volume: number;
  surchargeRate: number;
  surchargeRevenue: number;
  icSaving: number;
}

// ── Reform dates ─────────────────────────────────────────────────

export interface ReformDates {
  surchargeBan: string;
  domesticICCuts: string;
  foreignCardCap: string;
  msfPublication: string;
  passThroughReport: string;
}

// ── Card mix input (from merchant UI — all optional) ─────────────

export interface CardMixInput {
  visa_debit?: number;
  visa_credit?: number;
  mastercard_debit?: number;
  mastercard_credit?: number;
  eftpos?: number;
  amex?: number;
  foreign?: number;
}

// ── Merchant input overrides (from assessment form) ──────────────

export interface MerchantInputOverrides {
  cardMix?: CardMixInput;
  avgTransactionValue?: number;
  expertRates?: {
    debitCents?: number;
    creditPct?: number;
    marginPct?: number;
  };
  blendedRates?: {
    debitRate?: number;
    creditRate?: number;
  };
  minMonthlyFee?: number;
}

// ── Invoice parsed values (Phase 2) ──────────────────────────────

export interface InvoiceParsedValues {
  cardMix?: CardMixInput;
  avgTransactionValue?: number;
  msfRate?: number;
  debitCents?: number;
  creditPct?: number;
}

// ── Resolution context ───────────────────────────────────────────

export interface ResolutionContext {
  country: string;
  industry: string;
  merchantInput?: MerchantInputOverrides;
  invoiceParsed?: InvoiceParsedValues;
}

// ── Raw assessment form data (before resolution) ─────────────────

export interface RawAssessmentData {
  volume: number;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  surchargeNetworks: string[];
  industry: string;
  psp: string;
  passThrough: number;
  country: string;
  msfRateMode?: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate?: number;
  // estimatedMSFRate is DERIVED in resolver from msfRateMode + customMSFRate
}
