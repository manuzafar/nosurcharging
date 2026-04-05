# Business Rules Engine
## nosurcharging.com.au — Configurable Calculation Architecture

**Version:** 1.0 | **April 2026**

---

## 1. Why a Rules Engine

The calculation engine uses fixed inputs by default: RBA averages for card mix, env vars for operational tuning, TypeScript constants for rates. But merchants often know more than the defaults.

A merchant can tell us their actual card mix (Visa debit 60%, Visa credit 20%, Mastercard debit 15%, etc.). That is a new **source** for an existing input, not a new input. And it is only the first of many sources that will emerge across phases:

```
Phase 1:  Card mix = merchant input (optional) OR env var defaults OR RBA averages
Phase 2:  Card mix = invoice-parsed OR merchant input OR env var defaults OR averages
Phase 3:  Card mix = ERP-verified  OR invoice-parsed OR merchant input OR defaults
```

If we handle each of these by adding parameters to `calculateMetrics()`, we end up with a function that takes 40 parameters, is impossible to test exhaustively, and makes Phase 3 a rewrite. The strategic solution separates concerns:

1. **Rule definitions** — what inputs exist and their metadata
2. **Resolution strategies** — where each value can come from
3. **Resolution pipeline** — builds a fully resolved input set in priority order
4. **Calculation engine** — receives fully resolved inputs, knows nothing about sources

The calculation engine never changes. New sources are added by adding new resolution strategies. New inputs are added by extending the rule schema.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MERCHANT INPUT (UI)                       │
│  Card mix splits, expert interchange rates, surcharge data  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              RESOLUTION PIPELINE                            │
│                                                             │
│  resolveCardMix(sources):                                   │
│    Priority 1: Merchant explicit input (Phase 1)          │
│    Priority 2: Invoice-parsed values (Phase 2)              │
│    Priority 3: Industry-specific defaults (Phase 2)         │
│    Priority 4: Env var operational parameters               │
│    Priority 5: RBA regulatory averages (hardcoded)          │
│                                                             │
│  resolveRates(sources):                                     │
│    Priority 1: Expert mode (merchant-entered rates)         │
│    Priority 2: RBA averages from constants/au.ts            │
│                                                             │
│  Returns: ResolvedAssessmentInputs (fully populated)        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           CALCULATION ENGINE (pure functions)               │
│  calculateMetrics(resolved: ResolvedAssessmentInputs)       │
│  No knowledge of where values came from                     │
│  No fallbacks, no optional fields — everything is required  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           ASSESSMENT OUTPUT                                 │
│  category, plSwing, icSaving, confidence, metadata          │
│  + resolutionTrace (what source was used for each field)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. The Rule Schema

Every configurable input is defined in the rule schema. Adding a new configurable input means adding one entry to this schema — not changing the calculation engine.

```typescript
// packages/calculations/rules/schema.ts

export type RuleDataType = 'percentage' | 'currency' | 'cents' | 'boolean' | 'enum';
export type RuleSource = 'merchant_input' | 'invoice_parsed' | 'industry_default' | 'env_var' | 'regulatory_constant';

export interface RuleDefinition {
  key: string;                    // Unique identifier — used in resolution trace
  label: string;                  // Human-readable name (for UI and assumptions panel)
  dataType: RuleDataType;
  unit?: string;                  // Display unit: '%', 'c', 'AUD'
  min?: number;                   // Validation: minimum value
  max?: number;                   // Validation: maximum value
  sources: RuleSource[];          // Ordered by priority — first source wins
  defaultSource: RuleSource;      // Which source is the baseline fallback
  affectsConfidence: boolean;     // Does merchant input here improve confidence?
  phase: '1' | '2' | '3'; // When this rule becomes active
  description: string;            // Shown in assumptions panel
}

export const RULE_SCHEMA: RuleDefinition[] = [
  // ── Card mix inputs ────────────────────────────────────────────

  {
    key: 'cardMix.visa_debit',
    label: 'Visa debit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Visa debit cards',
  },
  {
    key: 'cardMix.visa_credit',
    label: 'Visa credit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Visa credit cards',
  },
  {
    key: 'cardMix.mastercard_debit',
    label: 'Mastercard debit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Mastercard debit cards',
  },
  {
    key: 'cardMix.mastercard_credit',
    label: 'Mastercard credit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Mastercard credit cards',
  },
  {
    key: 'cardMix.eftpos',
    label: 'eftpos share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are eftpos cards',
  },
  {
    key: 'cardMix.amex',
    label: 'Amex share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are American Express cards',
  },
  {
    key: 'cardMix.foreign',
    label: 'Foreign card share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are foreign-issued cards',
  },

  // ── Average transaction value ──────────────────────────────────

  {
    key: 'avgTransactionValue',
    label: 'Average transaction value',
    dataType: 'currency',
    unit: 'AUD',
    min: 1,
    max: 100000,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Average card transaction value. Used to calculate number of debit transactions.',
  },

  // ── Expert interchange rates ───────────────────────────────────

  {
    key: 'expertRates.debitCents',
    label: 'Debit interchange rate',
    dataType: 'cents',
    unit: 'c',
    min: 0,
    max: 50,
    sources: ['merchant_input', 'regulatory_constant'],
    defaultSource: 'regulatory_constant',
    affectsConfidence: true,
    phase: '1',
    description: 'Your actual debit interchange rate in cents per transaction.',
  },
  {
    key: 'expertRates.creditPct',
    label: 'Consumer credit interchange rate',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 5,
    sources: ['merchant_input', 'regulatory_constant'],
    defaultSource: 'regulatory_constant',
    affectsConfidence: true,
    phase: '1',
    description: 'Your actual consumer credit interchange rate as a percentage.',
  },
];
```

---

## 4. The Resolution Pipeline

```typescript
// packages/calculations/rules/resolver.ts

import { RULE_SCHEMA, RuleSource } from './schema';
import { AU_INTERCHANGE, AU_CARD_MIX_DEFAULTS } from '../constants/au';
import { getAvgTxnValue } from '../constants';

// ── Types ─────────────────────────────────────────────────────────

export interface CardMixInput {
  visa_debit?:        number; // 0.0–1.0 (proportion)
  visa_credit?:       number;
  mastercard_debit?:  number;
  mastercard_credit?: number;
  eftpos?:            number;
  amex?:              number;
  foreign?:           number;
}

// What the merchant provides in the UI (all optional — null = use default)
export interface MerchantInputOverrides {
  cardMix?:              CardMixInput;
  avgTransactionValue?:  number;
  expertRates?: {
    debitCents?:  number;
    creditPct?:   number;
    marginPct?:   number;
  };
}

// What an invoice parser extracts (Phase 2)
export interface InvoiceParsedValues {
  cardMix?:              CardMixInput;
  avgTransactionValue?:  number;
  msfRate?:              number;
  debitCents?:           number;
  creditPct?:            number;
}

// Resolution context — all possible sources
export interface ResolutionContext {
  country:           string;
  industry:          string;
  merchantInput?:    MerchantInputOverrides;
  invoiceParsed?:    InvoiceParsedValues;   // Phase 2
}

// The fully resolved card mix — all shares sum to 1.0, no nulls
export interface ResolvedCardMix {
  debitShare:          number;
  consumerCreditShare: number;
  foreignShare:        number;
  amexShare:           number;
  commercialShare:     number;
  // Breakdown by scheme (for Phase 1 granular calculations)
  breakdown?: {
    visa_debit:        number;
    visa_credit:       number;
    mastercard_debit:  number;
    mastercard_credit: number;
    eftpos:            number;
    amex:              number;
    foreign:           number;
    commercial:        number;
  };
}

// Resolution trace — tells the assumptions panel and confidence engine
// exactly which source was used for each field
export interface ResolutionTrace {
  [ruleKey: string]: {
    source:  RuleSource;
    value:   number;
    label:   string;    // Human-readable: "Your input" | "RBA average" | "Invoice data"
  };
}

// The fully resolved inputs — no nulls, no optionals
// This is what the calculation engine receives
export interface ResolvedAssessmentInputs {
  volume:              number;
  planType:            'flat' | 'costplus';
  msfRate:             number;
  surcharging:         boolean;
  surchargeRate:       number;
  surchargeNetworks:   string[];
  industry:            string;
  psp:                 string;
  passThrough:         number;
  cardMix:             ResolvedCardMix;
  avgTransactionValue: number;
  expertRates: {
    debitCents:  number;
    creditPct:   number;
    marginPct:   number;
  };
  resolutionTrace: ResolutionTrace;
  confidence:      'high' | 'medium' | 'low';
}

// ── Resolution functions ───────────────────────────────────────────

/**
 * Resolves a single numeric value from multiple sources in priority order.
 * Returns the first non-null value and records which source was used.
 */
function resolveValue(
  ruleKey: string,
  sources: Array<{ source: RuleSource; value: number | null | undefined }>
): { value: number; source: RuleSource } {
  for (const { source, value } of sources) {
    if (value !== null && value !== undefined && !isNaN(value)) {
      return { value, source };
    }
  }
  // This should never happen if regulatory_constant is always last and populated
  throw new Error(`No source resolved value for rule: ${ruleKey}`);
}

/**
 * Resolves the card mix from all available sources.
 * Result always sums to 1.0.
 */
function resolveCardMix(
  ctx: ResolutionContext,
  trace: ResolutionTrace
): ResolvedCardMix {
  const merchantMix = ctx.merchantInput?.cardMix;
  const invoiceMix  = ctx.invoiceParsed?.cardMix;

  // Resolve each component with source priority
  const components = {
    visa_debit:        resolveValue('cardMix.visa_debit', [
      { source: 'merchant_input',        value: merchantMix?.visa_debit },
      { source: 'invoice_parsed',        value: invoiceMix?.visa_debit },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_VISA_DEBIT ?? '') || null },
      { source: 'regulatory_constant',   value: 0.35 }, // RBA average: ~35% of transactions
    ]),
    visa_credit:       resolveValue('cardMix.visa_credit', [
      { source: 'merchant_input',        value: merchantMix?.visa_credit },
      { source: 'invoice_parsed',        value: invoiceMix?.visa_credit },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_VISA_CREDIT ?? '') || null },
      { source: 'regulatory_constant',   value: 0.18 },
    ]),
    mastercard_debit:  resolveValue('cardMix.mastercard_debit', [
      { source: 'merchant_input',        value: merchantMix?.mastercard_debit },
      { source: 'invoice_parsed',        value: invoiceMix?.mastercard_debit },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_MC_DEBIT ?? '') || null },
      { source: 'regulatory_constant',   value: 0.17 },
    ]),
    mastercard_credit: resolveValue('cardMix.mastercard_credit', [
      { source: 'merchant_input',        value: merchantMix?.mastercard_credit },
      { source: 'invoice_parsed',        value: invoiceMix?.mastercard_credit },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_MC_CREDIT ?? '') || null },
      { source: 'regulatory_constant',   value: 0.12 },
    ]),
    eftpos:            resolveValue('cardMix.eftpos', [
      { source: 'merchant_input',        value: merchantMix?.eftpos },
      { source: 'invoice_parsed',        value: invoiceMix?.eftpos },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_EFTPOS ?? '') || null },
      { source: 'regulatory_constant',   value: 0.08 },
    ]),
    amex:              resolveValue('cardMix.amex', [
      { source: 'merchant_input',        value: merchantMix?.amex },
      { source: 'invoice_parsed',        value: invoiceMix?.amex },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_AMEX ?? '') || null },
      { source: 'regulatory_constant',   value: 0.05 },
    ]),
    foreign:           resolveValue('cardMix.foreign', [
      { source: 'merchant_input',        value: merchantMix?.foreign },
      { source: 'invoice_parsed',        value: invoiceMix?.foreign },
      { source: 'env_var',               value: parseFloat(process.env.CALC_CARD_MIX_FOREIGN ?? '') || null },
      { source: 'regulatory_constant',   value: 0.05 },
    ]),
  };

  // Record in trace
  Object.entries(components).forEach(([key, { source, value }]) => {
    trace[`cardMix.${key}`] = {
      source,
      value,
      label: sourceLabel(source),
    };
  });

  // Normalise to 1.0 — merchant inputs may not sum perfectly
  const raw = {
    visa_debit:        components.visa_debit.value,
    visa_credit:       components.visa_credit.value,
    mastercard_debit:  components.mastercard_debit.value,
    mastercard_credit: components.mastercard_credit.value,
    eftpos:            components.eftpos.value,
    amex:              components.amex.value,
    foreign:           components.foreign.value,
    commercial:        0, // commercial not user-configurable
  };

  const total = Object.values(raw).reduce((sum, v) => sum + v, 0);

  if (Math.abs(total - 1.0) > 0.001 && total > 0) {
    // Normalise by dividing each by the total
    Object.keys(raw).forEach(k => {
      raw[k as keyof typeof raw] = raw[k as keyof typeof raw] / total;
    });
  }

  // Aggregate into the high-level card mix the engine expects
  return {
    debitShare:          raw.visa_debit + raw.mastercard_debit + raw.eftpos,
    consumerCreditShare: raw.visa_credit + raw.mastercard_credit,
    foreignShare:        raw.foreign,
    amexShare:           raw.amex,
    commercialShare:     raw.commercial,
    breakdown:           raw,
  };
}

/**
 * Main resolution function — builds fully resolved inputs from all sources.
 * This is the entry point from the assessment form submission.
 */
export function resolveAssessmentInputs(
  raw: {
    volume:           number;
    planType:         'flat' | 'costplus';
    msfRate:          number;
    surcharging:      boolean;
    surchargeRate:    number;
    surchargeNetworks: string[];
    industry:         string;
    psp:              string;
    passThrough:      number;
    country:          string;
  },
  ctx: ResolutionContext,
): ResolvedAssessmentInputs {
  const trace: ResolutionTrace = {};

  // Resolve card mix
  const cardMix = resolveCardMix(ctx, trace);

  // Resolve average transaction value
  const avgTxnResolved = resolveValue('avgTransactionValue', [
    { source: 'merchant_input',      value: ctx.merchantInput?.avgTransactionValue },
    { source: 'invoice_parsed',      value: ctx.invoiceParsed?.avgTransactionValue },
    { source: 'env_var',             value: parseFloat(process.env[`CALC_AVG_TXN_${raw.industry.toUpperCase()}`] ?? '') || null },
    { source: 'env_var',             value: parseFloat(process.env.CALC_AVG_TXN_DEFAULT ?? '') || null },
    { source: 'regulatory_constant', value: 65 },
  ]);
  trace.avgTransactionValue = {
    source: avgTxnResolved.source,
    value: avgTxnResolved.value,
    label: sourceLabel(avgTxnResolved.source),
  };

  // Resolve expert interchange rates
  const debitCents = resolveValue('expertRates.debitCents', [
    { source: 'merchant_input',      value: ctx.merchantInput?.expertRates?.debitCents },
    { source: 'regulatory_constant', value: 9 }, // 9 cents RBA average
  ]);
  const creditPct = resolveValue('expertRates.creditPct', [
    { source: 'merchant_input',      value: ctx.merchantInput?.expertRates?.creditPct },
    { source: 'regulatory_constant', value: 0.52 },
  ]);
  const marginPct = resolveValue('expertRates.marginPct', [
    { source: 'merchant_input',      value: ctx.merchantInput?.expertRates?.marginPct },
    { source: 'regulatory_constant', value: 0.10 },
  ]);
  trace['expertRates.debitCents'] = { source: debitCents.source, value: debitCents.value, label: sourceLabel(debitCents.source) };
  trace['expertRates.creditPct']  = { source: creditPct.source,  value: creditPct.value,  label: sourceLabel(creditPct.source) };
  trace['expertRates.marginPct']  = { source: marginPct.source,  value: marginPct.value,  label: sourceLabel(marginPct.source) };

  // Derive confidence from what sources were used
  const confidence = deriveConfidence(trace);

  return {
    ...raw,
    cardMix,
    avgTransactionValue: avgTxnResolved.value,
    expertRates: {
      debitCents: debitCents.value,
      creditPct:  creditPct.value,
      marginPct:  marginPct.value,
    },
    resolutionTrace: trace,
    confidence,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

function sourceLabel(source: RuleSource): string {
  const labels: Record<RuleSource, string> = {
    merchant_input:       'Your input',
    invoice_parsed:       'From your statement',
    industry_default:     'Industry average',
    env_var:              'RBA average',
    regulatory_constant:  'RBA average',
  };
  return labels[source];
}

function deriveConfidence(trace: ResolutionTrace): 'high' | 'medium' | 'low' {
  const rules = RULE_SCHEMA.filter(r => r.affectsConfidence);
  const merchantInputCount = rules.filter(r =>
    trace[r.key]?.source === 'merchant_input' ||
    trace[r.key]?.source === 'invoice_parsed'
  ).length;

  const ratio = merchantInputCount / rules.length;

  if (ratio >= 0.6) return 'high';
  if (ratio >= 0.2) return 'medium';
  return 'low';
}
```

---

## 5. Phase 1 — Merchant Card Mix UI

The card mix UI is an optional section in Step 2 (or a new Step 2.5). Merchants who know their card split can enter it. Those who don't skip it and get defaults.

### UI design

```
"Do you know your card mix? (optional)"

[Simple mode — skip this] ← default, most merchants
[I know my card split ↓] ← opens the panel

Card mix panel:
┌──────────────────────────────────────────────────┐
│ How your customers typically pay                 │
│ Percentages should add up to 100%                │
│                                                  │
│  Visa debit          [    ] %                    │
│  Visa credit         [    ] %                    │
│  Mastercard debit    [    ] %                    │
│  Mastercard credit   [    ] %                    │
│  eftpos              [    ] %                    │
│  Amex                [    ] %                    │
│  Foreign cards       [    ] %                    │
│                                                  │
│  Total: [live sum shown here]                    │
│  [warning if != 100%]                            │
└──────────────────────────────────────────────────┘
```

### Key UX rules for the card mix input

1. **All fields optional** — partial input is valid. If a merchant enters Visa debit (60%) and leaves everything else blank, the system fills in the remaining 40% using RBA averages normalised to sum to 100%.

2. **Live total display** — shows the running sum. Green when 100%, amber when over/under. Never block progression — just show the warning.

3. **Auto-normalise, don't reject** — if the total is 98% or 102%, normalise silently. If the total is wildly off (e.g. 150%), show an error.

4. **"Your card mix improves accuracy" badge** — when any field is filled, the confidence badge updates to show a higher confidence level. This incentivises input without forcing it.

### Component: CardMixInput

```typescript
// components/assessment/CardMixInput.tsx

interface CardMixInputProps {
  value:    CardMixInput;
  onChange: (cardMix: CardMixInput) => void;
}

// Validation
function validateCardMix(mix: CardMixInput): {
  valid: boolean;
  total: number;
  warning: string | null;
} {
  const total = Object.values(mix)
    .filter(v => v !== null && v !== undefined)
    .reduce((sum, v) => sum + (v as number), 0);

  if (total === 0) return { valid: true, total: 0, warning: null };
  if (total > 110) return { valid: false, total, warning: `Total is ${total.toFixed(1)}% — please check your splits` };
  if (Math.abs(total - 100) > 5) return { valid: true, total, warning: `Total is ${total.toFixed(1)}% — we'll adjust to 100%` };
  return { valid: true, total, warning: null };
}
```

---

## 6. The Assumptions Panel (updated for Phase 1)

The assumptions panel now shows the resolution trace — exactly what source was used for each value. This is the transparency mechanism that builds trust with payment wizards.

```
How we calculated this ▲

Card mix used:
  Visa debit       35%   ← Your input
  Visa credit      18%   ← Your input
  Mastercard debit 17%   ← RBA average (you didn't provide this)
  Mastercard credit 12%  ← RBA average
  eftpos            8%   ← RBA average
  Amex              5%   ← Your input
  Foreign           5%   ← RBA average
  ────────────────────
  Total            100%

Average transaction  $65   ← Your input
Debit IC saving      9c → 8c per transaction (RBA cap)
Credit IC saving     0.52% → 0.30% (RBA cap)
Scheme fees          10.5bps domestic (unregulated, unchanged)

Confidence: High — 4 of 7 card mix values from your input
Source: RBA Conclusions Paper, March 2026
```

The resolution trace (`resolutionTrace` in `ResolvedAssessmentInputs`) directly drives this display. No manual mapping needed.

---

## 7. Updated Calculation Engine

The calculation engine itself changes minimally for Phase 1. It already accepts a card mix object. The key change is that the card mix now has a `breakdown` property with scheme-level detail, enabling per-scheme savings calculations.

```typescript
// packages/calculations/calculations.ts (updated for Phase 1)

export function calculateMetrics(
  resolved: ResolvedAssessmentInputs,
  now: Date = new Date()
): AssessmentOutputs {
  const { current, projected } = getRatesForPeriod(now);
  const { volume, cardMix, avgTransactionValue, expertRates } = resolved;

  // Current rates (expert override or RBA average)
  const currentDebitCents = Math.min(expertRates.debitCents, current.debitCentsPerTxn * 100);
  const currentCreditPct  = Math.min(expertRates.creditPct / 100, current.consumerCreditPct);

  // Phase 1: scheme-level debit saving when breakdown is available
  const debitSaving = cardMix.breakdown
    ? calculateDebitSavingByScheme(volume, cardMix.breakdown, avgTransactionValue, current, projected)
    : calculateDebitSavingSimple(volume, cardMix.debitShare, avgTransactionValue, current, projected);

  const creditSaving = volume * cardMix.consumerCreditShare *
    (currentCreditPct - (projected?.consumerCreditPct ?? currentCreditPct));

  const totalICSaving = debitSaving + creditSaving;

  // ... rest of calculation unchanged ...
}

// Phase 1 — calculate debit saving per scheme
// Visa debit, Mastercard debit, and eftpos may have different rates/structures
function calculateDebitSavingByScheme(
  volume:      number,
  breakdown:   ResolvedCardMix['breakdown'],
  avgTxn:      number,
  current:     InterchangeRates,
  projected:   InterchangeRates | null,
): number {
  if (!breakdown || !projected) return 0;

  const schemes = [
    { key: 'visa_debit',        share: breakdown.visa_debit },
    { key: 'mastercard_debit',  share: breakdown.mastercard_debit },
    { key: 'eftpos',            share: breakdown.eftpos },
  ];

  return schemes.reduce((total, scheme) => {
    const txns   = (volume * scheme.share) / avgTxn;
    const saving = txns * (current.debitCentsPerTxn - projected.debitCentsPerTxn);
    return total + saving;
  }, 0);
}
```

---

## 8. Adding New Rules — The Pattern

When a new configurable input is needed (e.g. Phase 2: merchant's actual MSF rate from invoice):

**Step 1** — Add to schema:
```typescript
// In rules/schema.ts
{
  key: 'msfRate',
  label: 'Your merchant service fee rate',
  dataType: 'percentage',
  unit: '%',
  min: 0.1,
  max: 5.0,
  sources: ['invoice_parsed', 'merchant_input', 'env_var', 'regulatory_constant'],
  defaultSource: 'env_var',
  affectsConfidence: true,
  phase: '2',
  description: 'Your blended MSF rate from your PSP statement.',
},
```

**Step 2** — Add resolution in resolver:
```typescript
// In resolveAssessmentInputs():
const msfRate = resolveValue('msfRate', [
  { source: 'invoice_parsed', value: ctx.invoiceParsed?.msfRate },
  { source: 'merchant_input', value: ctx.merchantInput?.msfRate },
  { source: 'env_var',        value: parseFloat(process.env.CALC_DEFAULT_MSF ?? '') || null },
  { source: 'regulatory_constant', value: 0.014 }, // 1.4% RBA small merchant average
]);
trace.msfRate = { source: msfRate.source, value: msfRate.value, label: sourceLabel(msfRate.source) };
```

**Step 3** — Use in calculation engine:
```typescript
// In calculateMetrics():
const annualMSF = resolved.volume * resolved.msfRate;
```

**The calculation engine itself does not change** when new sources are added. Only the resolver changes.

---

## 9. Testing the Rules Engine

```typescript
// packages/calculations/__tests__/resolver.test.ts

describe('resolveAssessmentInputs', () => {
  describe('card mix resolution', () => {
    it('uses merchant input when provided', () => {
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
        merchantInput: {
          cardMix: { visa_debit: 0.60, visa_credit: 0.20 },
        },
      });
      expect(resolved.resolutionTrace['cardMix.visa_debit'].source).toBe('merchant_input');
      expect(resolved.resolutionTrace['cardMix.visa_debit'].value).toBe(0.60);
    });

    it('falls back to env var when merchant input is absent', () => {
      process.env.CALC_CARD_MIX_VISA_DEBIT = '0.40';
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
        merchantInput: {},
      });
      expect(resolved.resolutionTrace['cardMix.visa_debit'].source).toBe('env_var');
      expect(resolved.resolutionTrace['cardMix.visa_debit'].value).toBe(0.40);
    });

    it('falls back to regulatory constant when no env var', () => {
      delete process.env.CALC_CARD_MIX_VISA_DEBIT;
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
      });
      expect(resolved.resolutionTrace['cardMix.visa_debit'].source).toBe('regulatory_constant');
    });

    it('normalises card mix to sum to 1.0', () => {
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
        merchantInput: {
          cardMix: {
            visa_debit: 0.60,
            visa_credit: 0.30,
            // remaining 10% not provided — filled from defaults
          },
        },
      });
      const { breakdown } = resolved.cardMix;
      const total = Object.values(breakdown!).reduce((s, v) => s + v, 0);
      expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
    });

    it('assigns high confidence when majority of fields are merchant-provided', () => {
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
        merchantInput: {
          cardMix: {
            visa_debit: 0.35,
            visa_credit: 0.18,
            mastercard_debit: 0.17,
            mastercard_credit: 0.12,
          },
        },
      });
      expect(resolved.confidence).toBe('high');
    });

    it('assigns low confidence when all fields are defaults', () => {
      const resolved = resolveAssessmentInputs(baseRaw, {
        country: 'AU',
        industry: 'retail',
      });
      expect(resolved.confidence).toBe('low');
    });
  });
});
```

---

## 10. Phase Roadmap for the Rules Engine

| Phase | New rules added | New sources added |
|---|---|---|
| 1 | Expert rates (debit cents, credit %, margin %) | merchant_input, regulatory_constant |
| 1 | Card mix splits (7 fields), avg transaction value | merchant_input (new fields) |
| 2 | MSF rate, PSP-reported rates, invoice-derived card mix | invoice_parsed (new source) |
| 2.5 | Industry benchmarks from PSP Rate Registry | industry_default (new source) |
| 3 | ERP-verified actuals, contracted rates | erp_verified (new source) |

The resolution pipeline is extended at each phase. The schema grows. The calculation engine does not change.

---

## 11. Document the New Environment Variables

Phase 1 adds granular card mix env vars to Tier 2:

```bash
# Granular card mix by scheme (overrides the aggregate values)
# Must sum to 1.0 or will be normalised
CALC_CARD_MIX_VISA_DEBIT=0.35
CALC_CARD_MIX_VISA_CREDIT=0.18
CALC_CARD_MIX_MC_DEBIT=0.17
CALC_CARD_MIX_MC_CREDIT=0.12
CALC_CARD_MIX_EFTPOS=0.08
CALC_CARD_MIX_AMEX=0.05
CALC_CARD_MIX_FOREIGN=0.05
# Sum: 1.00
```

These replace the simpler aggregate env vars (`CALC_CARD_MIX_DEBIT`, `CALC_CARD_MIX_CREDIT`, etc.) which are now derived from the granular values.

---

## 12. Summary of the Design

| Concern | Solution | Location |
|---|---|---|
| What inputs exist | Rule schema with metadata | `rules/schema.ts` |
| Where values come from | Layered resolution strategies | `rules/resolver.ts` |
| Priority order | Sources array in each rule definition | `rules/schema.ts` |
| Fallback behaviour | `resolveValue()` tries each source in order | `rules/resolver.ts` |
| Confidence scoring | Derived from resolution trace | `rules/resolver.ts` |
| Assumptions display | Driven by resolutionTrace in outputs | `components/results/` |
| Pure calculation | Receives fully-resolved inputs, no optionals | `calculations.ts` |
| Testing | Resolver tests independent of calculation tests | `__tests__/resolver.test.ts` |
| Adding a new input | Add to schema + add resolution in resolver | No change to calculation engine |
| Adding a new source | Add new ResolutionContext field + resolver cases | No change to schema or engine |

---

*Business Rules Engine v1.0 · nosurcharging.com.au · April 2026*
