'use client';

// RefinementPanel — SPRINT_BRIEF.md Sprint 2 / UX-01 through UX-07.
// The comprehension answer: pre-populated fields the merchant can edit.
// Live P&L updates, live field deltas, accuracy climbing from 20% → 95%.
//
// Local state only — no DB write until "Save my refinements" click
// (save not wired in Phase 1; state persists for the session).
//
// Debounced (150ms) so P&L doesn't thrash on every keystroke.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import type {
  AssessmentOutputs,
  ResolvedAssessmentInputs,
  ResolutionTrace,
  CardMixBreakdown,
} from '@nosurcharging/calculations/types';
import { computeAccuracy } from '@/lib/accuracy';

// ── Props ───────────────────────────────────────────────────────

interface RefinementPanelProps {
  initialResult: AssessmentOutputs;
  resolutionTrace: ResolutionTrace;
  inputs: ResolvedAssessmentInputs;
  industry: string;
  onRefinedResult: (result: AssessmentOutputs) => void;
  onAccuracyChange?: (accuracy: number) => void;
}

// ── Edit state ──────────────────────────────────────────────────

interface EditState {
  avgTransactionValue?: number;
  creditPct?: number;          // percentage points (e.g. 0.47 means 0.47%)
  commercialShare?: number;    // proportion (e.g. 0.30 means 30%)
  monthlyDebitTxns?: number;
  minMonthlyFee?: number;      // dollars/month — flat-rate merchants only
}

type EditKey = keyof EditState;

// ── Pure helpers ────────────────────────────────────────────────

// Build ResolvedAssessmentInputs with edits applied. Pure — no side effects.
function applyEdits(
  inputs: ResolvedAssessmentInputs,
  edits: EditState,
): ResolvedAssessmentInputs {
  // AVT: explicit override wins; else derive from monthly debit txns if given.
  let avgTransactionValue = inputs.avgTransactionValue;
  if (edits.avgTransactionValue !== undefined && edits.avgTransactionValue > 0) {
    avgTransactionValue = edits.avgTransactionValue;
  } else if (edits.monthlyDebitTxns !== undefined && edits.monthlyDebitTxns > 0) {
    // monthly debit txns × 12 = annual debit txns.
    // annual debit $ = volume × debitShare.
    // AVT = annual debit $ / annual debit txns.
    const annualDebitTxns = edits.monthlyDebitTxns * 12;
    const annualDebitDollars = inputs.volume * inputs.cardMix.debitShare;
    if (annualDebitTxns > 0) {
      avgTransactionValue = annualDebitDollars / annualDebitTxns;
    }
  }

  const creditPct =
    edits.creditPct !== undefined ? edits.creditPct : inputs.expertRates.creditPct;

  // Commercial share: redistribute from consumer credit (visa_credit + mc_credit)
  // into the commercial bucket so card mix still sums to 1.0.
  let cardMix = inputs.cardMix;
  if (edits.commercialShare !== undefined) {
    const targetCommercial = Math.max(0, Math.min(1, edits.commercialShare));
    const consumerCreditTotal =
      inputs.cardMix.breakdown.visa_credit + inputs.cardMix.breakdown.mastercard_credit;

    // Headroom: can move at most the existing consumer credit pool into commercial.
    const actualCommercial = Math.min(targetCommercial, consumerCreditTotal + inputs.cardMix.breakdown.commercial);
    const delta = actualCommercial - inputs.cardMix.breakdown.commercial;
    const newCCTotal = Math.max(0, consumerCreditTotal - delta);
    const scale = consumerCreditTotal > 0 ? newCCTotal / consumerCreditTotal : 0;

    const newBreakdown: CardMixBreakdown = {
      ...inputs.cardMix.breakdown,
      visa_credit: inputs.cardMix.breakdown.visa_credit * scale,
      mastercard_credit: inputs.cardMix.breakdown.mastercard_credit * scale,
      commercial: actualCommercial,
    };

    cardMix = {
      ...inputs.cardMix,
      breakdown: newBreakdown,
      consumerCreditShare: newBreakdown.visa_credit + newBreakdown.mastercard_credit,
      commercialShare: actualCommercial,
    };
  }

  // Min monthly fee — flat-rate floor on annualMSF. Undefined when the merchant
  // hasn't entered one; engine then uses volume × rate without a floor.
  const minMonthlyFee =
    edits.minMonthlyFee !== undefined && edits.minMonthlyFee > 0
      ? edits.minMonthlyFee
      : inputs.minMonthlyFee;

  return {
    ...inputs,
    avgTransactionValue,
    expertRates: { ...inputs.expertRates, creditPct },
    cardMix,
    minMonthlyFee,
  };
}

// Apply only one edit and compute the impact on the specific metric.
function computeFieldDelta(
  fieldKey: EditKey,
  newValue: number,
  initialResult: AssessmentOutputs,
  inputs: ResolvedAssessmentInputs,
): { label: string; positive: boolean } {
  const edits: EditState = { [fieldKey]: newValue };
  const newInputs = applyEdits(inputs, edits);
  const newResult = calculateMetrics(newInputs);

  const targetKey: 'debitSaving' | 'creditSaving' =
    fieldKey === 'avgTransactionValue' || fieldKey === 'monthlyDebitTxns'
      ? 'debitSaving'
      : 'creditSaving';

  const delta = newResult[targetKey] - initialResult[targetKey];
  if (Math.abs(delta) < 1) return { label: '', positive: true };
  const sign = delta > 0 ? '+' : '−';
  const label = `${sign}$${Math.abs(Math.round(delta)).toLocaleString('en-AU')} vs default`;
  return { label, positive: delta > 0 };
}

// Source → badge text + emerald flag.
function getBadge(
  traceKey: string,
  userEdited: boolean,
  trace: ResolutionTrace,
): { label: string; emerald: boolean } {
  if (userEdited) return { label: 'Your input', emerald: true };
  const entry = trace[traceKey];
  if (!entry) return { label: 'RBA average', emerald: false };
  if (entry.source === 'merchant_input' || entry.source === 'invoice_parsed') {
    return { label: 'Your input', emerald: true };
  }
  if (entry.source === 'industry_default') {
    return { label: 'Industry default', emerald: false };
  }
  return { label: 'RBA average', emerald: false };
}

// Hospitality industries get a tighter AVT hint (lower-of kink bites below $50).
const HOSPITALITY_INDUSTRIES = new Set(['cafe', 'hospitality', 'restaurant', 'bar']);
const B2B_INDUSTRIES = new Set(['b2b', 'professional', 'wholesale', 'trade']);

// ── Small presentational helpers ────────────────────────────────

function Badge({ label, emerald }: { label: string; emerald: boolean }) {
  return (
    <span
      className="inline-block rounded-pill text-micro font-medium"
      style={{
        padding: '2px 8px',
        background: emerald ? '#EBF6F3' : 'var(--color-background-secondary)',
        color: emerald ? '#1A6B5A' : 'var(--color-text-tertiary)',
        border: emerald ? '0.5px solid #B5DBD0' : '0.5px solid var(--color-border-secondary)',
      }}
    >
      {label}
    </span>
  );
}

function ImpactChip({ label, tone }: { label: string; tone: 'danger' | 'warning' | 'neutral' }) {
  const palette = tone === 'danger'
    ? { bg: 'var(--color-background-danger)', fg: 'var(--color-text-danger)' }
    : tone === 'warning'
    ? { bg: 'var(--color-background-warning)', fg: 'var(--color-text-warning)' }
    : { bg: 'var(--color-background-secondary)', fg: 'var(--color-text-tertiary)' };
  return (
    <span
      className="inline-block rounded-pill text-micro font-medium"
      style={{ padding: '2px 8px', background: palette.bg, color: palette.fg }}
    >
      {label}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────

export function RefinementPanel({
  initialResult,
  resolutionTrace,
  inputs,
  industry,
  onRefinedResult,
  onAccuracyChange,
}: RefinementPanelProps) {
  const [edits, setEdits] = useState<EditState>({});
  const onRefinedResultRef = useRef(onRefinedResult);
  const onAccuracyChangeRef = useRef(onAccuracyChange);
  useEffect(() => {
    onRefinedResultRef.current = onRefinedResult;
  }, [onRefinedResult]);
  useEffect(() => {
    onAccuracyChangeRef.current = onAccuracyChange;
  }, [onAccuracyChange]);

  // Debounced recalc — pushes a refined result upward so the headline P&L
  // animates smoothly without thrashing on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const newInputs = applyEdits(inputs, edits);
      const result = calculateMetrics(newInputs);
      onRefinedResultRef.current(result);
    }, 150);
    return () => clearTimeout(timer);
  }, [edits, inputs]);

  const accuracy = useMemo(
    () => computeAccuracy(resolutionTrace, edits),
    [resolutionTrace, edits],
  );

  // Push accuracy changes up to the page (for TopBar)
  useEffect(() => {
    onAccuracyChangeRef.current?.(accuracy);
  }, [accuracy]);

  // ── Field pre-fills ───────────────────────────────────────────
  const avtPrefill = Math.round(inputs.avgTransactionValue);
  const creditPrefill = inputs.expertRates.creditPct;          // e.g. 0.47
  const commercialPrefill = inputs.cardMix.breakdown.commercial; // e.g. 0.0

  const industryLower = industry.toLowerCase();
  const isHospitality = HOSPITALITY_INDUSTRIES.has(industryLower);
  const isB2B = B2B_INDUSTRIES.has(industryLower);

  // ── AVT field ──
  const avtEdited = edits.avgTransactionValue !== undefined;
  const avtValue = edits.avgTransactionValue ?? avtPrefill;
  const avtBadge = getBadge('avgTransactionValue', avtEdited, resolutionTrace);
  const avtBelowKink = avtValue < 50;
  const avtChip = avtBelowKink
    ? <ImpactChip label="Critical — below $50 kink" tone="danger" />
    : <ImpactChip label="Moderate impact" tone="neutral" />;
  const avtDelta = avtEdited
    ? computeFieldDelta('avgTransactionValue', avtValue, initialResult, inputs)
    : { label: '', positive: true };
  const avtHint = isHospitality
    ? "Most cafés sit $8–$35. Check your PSP's 'average ticket size' or add up this week's takings and divide by your transaction count."
    : "Check your PSP dashboard for 'average ticket size', or take a week's card revenue and divide by the transaction count.";

  // ── Credit rate field (cost-plus only) ──
  const showCreditField = inputs.planType === 'costplus';
  const creditEdited = edits.creditPct !== undefined;
  const creditValue = edits.creditPct ?? creditPrefill;
  const creditBadge = getBadge('expertRates.creditPct', creditEdited, resolutionTrace);
  const creditChip = isB2B
    ? <ImpactChip label="Key figure" tone="warning" />
    : <ImpactChip label="High impact" tone="warning" />;
  const creditDelta = creditEdited
    ? computeFieldDelta('creditPct', creditValue, initialResult, inputs)
    : { label: '', positive: true };

  // ── Commercial share field ──
  const commercialEdited = edits.commercialShare !== undefined;
  const commercialValue = edits.commercialShare ?? commercialPrefill;
  const commercialBadge = getBadge('cardMix.visa_credit', commercialEdited, resolutionTrace);
  const commercialDelta = commercialEdited
    ? computeFieldDelta('commercialShare', commercialValue, initialResult, inputs)
    : { label: '', positive: true };

  // ── More options toggle (fields 4 + 5) ──
  // Default collapsed per editorial M3 brief. The previous
  // `commercialExpanded` toggle is gone — commercial share is now
  // a regular always-visible row above the toggle.
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // ── Monthly debit txns field ──
  const monthlyTxnsEdited = edits.monthlyDebitTxns !== undefined;
  const monthlyTxnsValue = edits.monthlyDebitTxns ?? '';
  const monthlyTxnsDelta = monthlyTxnsEdited
    ? computeFieldDelta('monthlyDebitTxns', Number(monthlyTxnsValue) || 0, initialResult, inputs)
    : { label: '', positive: true };

  // ── Min monthly fee field (flat/blended only) ──
  // Lots of PSP contracts include a minimum monthly charge. When volume × rate
  // is below that floor, the merchant pays the minimum instead. Surfacing this
  // sharpens the annualMSF number for low-volume merchants.
  const showMinFeeField = inputs.planType === 'flat' || inputs.planType === 'blended';
  const minFeeEdited = edits.minMonthlyFee !== undefined;
  const minFeeValue = edits.minMonthlyFee ?? '';
  const minFeeBadge = minFeeEdited
    ? { label: 'Your input', emerald: true }
    : { label: 'Not set', emerald: false };

  // ── Helpers to update edits ───────────────────────────────────
  const updateEdit = <K extends EditKey>(key: K, value: EditState[K]) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };
  const clearEdit = (key: EditKey) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Eyebrow + accuracy meta moved out to page-level SectionHeader.
  // The intro line below stays — it's body copy, not a header.
  return (
    <section
      className="px-5 min-[501px]:px-8"
      aria-label="Refine your estimate"
    >
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.55,
          marginBottom: '8px',
        }}
      >
        Fill in what you know — the estimate sharpens as you go.
      </p>

      {/* ── Field 1: Average transaction value ───────────────── */}
      <FieldCard
        label="Average transaction value"
        badge={avtBadge}
        delta={avtDelta}
        hint={avtHint}
      >
        <div className="flex items-center" style={{ gap: '4px' }}>
          <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>$</span>
          <input
            type="number"
            min={1}
            step={1}
            value={edits.avgTransactionValue ?? avtPrefill}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v) || v <= 0) clearEdit('avgTransactionValue');
              else updateEdit('avgTransactionValue', v);
            }}
            className="refine-input w-20 font-mono"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textAlign: 'right',
            }}
          />
          <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>per txn</span>
        </div>
      </FieldCard>

      {/* ── Field 2: Credit interchange rate (cost-plus only) ── */}
      {showCreditField && (
        <FieldCard
          label="Credit interchange rate"
          badge={creditBadge}
          delta={creditDelta}
          hint="Small merchants may pay up to 0.80%; enterprise merchants closer to 0.30%. Find it on the interchange line of your statement."
        >
          <div className="flex items-center" style={{ gap: '4px' }}>
            <input
              type="number"
              min={0.10}
              max={0.80}
              step={0.01}
              value={edits.creditPct ?? Number(creditPrefill.toFixed(2))}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (isNaN(v) || v <= 0) clearEdit('creditPct');
                else updateEdit('creditPct', v);
              }}
              className="refine-input w-20 font-mono"
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                textAlign: 'right',
              }}
            />
            <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
          </div>
        </FieldCard>
      )}

      {/* ── Field 3: Commercial card share — also a settings-row ── */}
      <FieldCard
        label={`Corporate / business card share${isB2B ? ' (likely relevant)' : ' (optional)'}`}
        badge={commercialBadge}
        delta={commercialDelta}
        hint="Corporate card interchange is UNCHANGED by the reform — raising this share lowers your projected saving."
      >
        <div className="flex items-center" style={{ gap: '4px' }}>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={edits.commercialShare !== undefined ? Math.round(edits.commercialShare * 100) : Math.round(commercialPrefill * 100)}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (isNaN(v) || v < 0) clearEdit('commercialShare');
              else updateEdit('commercialShare', Math.min(100, v) / 100);
            }}
            className="refine-input w-20 font-mono"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textAlign: 'right',
            }}
          />
          <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
        </div>
      </FieldCard>

      {/* "+ More options" — fields 4 and 5 hide behind this toggle.
          Default state collapsed per the editorial brief §"Refine
          overhaul · More options link". */}
      <button
        type="button"
        onClick={() => setShowMoreOptions((v) => !v)}
        className="cursor-pointer w-full text-left"
        style={{
          background: 'none',
          border: 'none',
          padding: '14px 0 0',
          color: 'var(--color-text-tertiary)',
          fontSize: '12px',
        }}
      >
        <span className="inline-flex items-center" style={{ gap: '6px' }}>
          {showMoreOptions ? (
            <ChevronUp size={12} aria-hidden />
          ) : (
            <ChevronDown size={12} aria-hidden />
          )}
          {showMoreOptions ? 'Fewer options' : 'More options'}
        </span>
      </button>

      {showMoreOptions && (
        <>
          {/* ── Field 4: Monthly debit transactions ───────────────── */}
          <FieldCard
            label="Monthly debit card transactions"
            badge={getBadge('__monthlyDebitTxns', monthlyTxnsEdited, resolutionTrace)}
            delta={monthlyTxnsDelta}
            hint="If you'd rather count transactions than guess an average, enter your monthly Visa + Mastercard + eftpos count."
          >
            <div className="flex items-center" style={{ gap: '4px' }}>
              <input
                type="number"
                min={0}
                step={1}
                value={edits.monthlyDebitTxns ?? ''}
                placeholder="e.g. 1,200"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v) || v <= 0) clearEdit('monthlyDebitTxns');
                  else updateEdit('monthlyDebitTxns', v);
                }}
                className="refine-input w-24 font-mono"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  textAlign: 'right',
                }}
              />
              <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>/month</span>
            </div>
          </FieldCard>

          {/* ── Field 5: Minimum monthly fee (flat/blended only) ─── */}
          {showMinFeeField && (
            <FieldCard
              label="Minimum monthly fee"
              badge={minFeeBadge}
              delta={{ label: '', positive: true }}
              hint="Many PSP contracts include a minimum monthly charge. Check your last few statements for a line like 'Minimum monthly fee'."
            >
              <div className="flex items-center" style={{ gap: '4px' }}>
                <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>$</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={minFeeValue}
                  placeholder="25"
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (isNaN(v) || v <= 0) clearEdit('minMonthlyFee');
                    else updateEdit('minMonthlyFee', v);
                  }}
                  className="refine-input w-20 font-mono"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    textAlign: 'right',
                  }}
                />
                <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>/month</span>
              </div>
            </FieldCard>
          )}
        </>
      )}

      <p className="mt-4 text-micro" style={{ color: 'var(--color-text-tertiary)' }}>
        Your edits update this page only. We never share or store what you type here.
      </p>
    </section>
  );
}

// ── FieldCard — shared layout for each refinement field ─────────

interface FieldCardProps {
  label: string;
  badge: { label: string; emerald: boolean };
  // ImpactChip dropped per editorial M3 polish — one chip per row max.
  // The source chip on the right tells the merchant where the value
  // came from; the impact chip ("Critical", "Tracks IC saving", etc.)
  // was redundant with the field's hint copy.
  delta: { label: string; positive: boolean };
  hint: string;
  children: React.ReactNode;
}

function FieldCard({ label, badge, delta, hint, children }: FieldCardProps) {
  // Settings-panel row per editorial M3 polish: one row per field,
  // label + hint subline on the left; source chip + value (input) on
  // the right. ImpactChip dropped — only the source chip survives.
  // Delta sits as a small mono note next to the value when present.
  return (
    <div
      className="flex items-start justify-between"
      style={{
        gap: '16px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        padding: '16px 0',
      }}
    >
      {/* Left column — label (14px / weight 500) + hint subline */}
      <div className="flex-1" style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
            marginTop: '3px',
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      </div>

      {/* Right column — source chip + value (input) + delta beneath */}
      <div
        className="shrink-0 flex flex-col items-end"
        style={{ gap: '6px' }}
      >
        <div className="flex items-center" style={{ gap: '8px' }}>
          <Badge {...badge} />
          {children}
        </div>
        {delta.label && (
          <span
            className="font-mono"
            style={{
              fontSize: '11px',
              color: delta.positive
                ? 'var(--color-text-success)'
                : 'var(--color-text-danger)',
            }}
          >
            {delta.label}
          </span>
        )}
      </div>
    </div>
  );
}
