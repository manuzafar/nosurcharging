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
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import type {
  AssessmentOutputs,
  ResolvedAssessmentInputs,
  ResolutionTrace,
  CardMixBreakdown,
} from '@nosurcharging/calculations/types';

// ── Props ───────────────────────────────────────────────────────

interface RefinementPanelProps {
  initialResult: AssessmentOutputs;
  resolutionTrace: ResolutionTrace;
  inputs: ResolvedAssessmentInputs;
  industry: string;
  onRefinedResult: (result: AssessmentOutputs) => void;
}

// ── Edit state ──────────────────────────────────────────────────

interface EditState {
  avgTransactionValue?: number;
  creditPct?: number;          // percentage points (e.g. 0.47 means 0.47%)
  commercialShare?: number;    // proportion (e.g. 0.30 means 30%)
  monthlyDebitTxns?: number;
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

  return {
    ...inputs,
    avgTransactionValue,
    expertRates: { ...inputs.expertRates, creditPct },
    cardMix,
  };
}

// Accuracy score: base 20; +25 AVT; +25 credit; +15 commercial; +15 monthly txns.
function computeAccuracy(
  trace: ResolutionTrace,
  edits: EditState,
): number {
  let score = 20;

  const hasUserSource = (key: string) => {
    const s = trace[key]?.source;
    return s === 'merchant_input' || s === 'invoice_parsed';
  };

  if (edits.avgTransactionValue !== undefined || hasUserSource('avgTransactionValue')) {
    score += 25;
  }
  if (edits.creditPct !== undefined || hasUserSource('expertRates.creditPct')) {
    score += 25;
  }
  if (
    edits.commercialShare !== undefined ||
    hasUserSource('cardMix.visa_credit') ||
    hasUserSource('cardMix.mastercard_credit')
  ) {
    score += 15;
  }
  if (edits.monthlyDebitTxns !== undefined) {
    score += 15;
  }

  return Math.min(100, score);
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
}: RefinementPanelProps) {
  const [edits, setEdits] = useState<EditState>({});
  const onRefinedResultRef = useRef(onRefinedResult);
  useEffect(() => {
    onRefinedResultRef.current = onRefinedResult;
  }, [onRefinedResult]);

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
  const [commercialExpanded, setCommercialExpanded] = useState(isB2B);
  const commercialBadge = getBadge('cardMix.visa_credit', commercialEdited, resolutionTrace);
  const commercialDelta = commercialEdited
    ? computeFieldDelta('commercialShare', commercialValue, initialResult, inputs)
    : { label: '', positive: true };

  // ── Monthly debit txns field ──
  const monthlyTxnsEdited = edits.monthlyDebitTxns !== undefined;
  const monthlyTxnsValue = edits.monthlyDebitTxns ?? '';
  const monthlyTxnsDelta = monthlyTxnsEdited
    ? computeFieldDelta('monthlyDebitTxns', Number(monthlyTxnsValue) || 0, initialResult, inputs)
    : { label: '', positive: true };

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

  return (
    <section
      className="rounded-xl p-5"
      style={{
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
      }}
      aria-label="Refine your estimate"
    >
      {/* Header + accuracy score */}
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Make it yours
          </h3>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Fill in what you know — the estimate sharpens as you go.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className="font-mono"
            style={{ fontSize: '22px', color: '#1A6B5A' }}
          >
            {accuracy}%
          </p>
          <p className="text-micro" style={{ color: 'var(--color-text-tertiary)' }}>
            Estimate accuracy
          </p>
        </div>
      </div>

      {/* Progress bar for accuracy */}
      <div
        className="mt-3 rounded-full overflow-hidden"
        style={{ height: '4px', background: 'var(--color-background-secondary)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${accuracy}%`,
            background: '#1A6B5A',
            transition: 'width 180ms ease-out',
          }}
        />
      </div>

      {/* ── Field 1: Average transaction value ───────────────── */}
      <FieldCard
        label="Average transaction value"
        badge={avtBadge}
        chip={avtChip}
        delta={avtDelta}
        hint={avtHint}
      >
        <div className="flex items-center gap-2">
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
            className="w-24 rounded-lg px-2 py-1 font-mono text-body-sm outline-none min-h-[40px]"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>per transaction</span>
        </div>
      </FieldCard>

      {/* ── Field 2: Credit interchange rate (cost-plus only) ── */}
      {showCreditField && (
        <FieldCard
          label="Credit interchange rate"
          badge={creditBadge}
          chip={creditChip}
          delta={creditDelta}
          hint="Small merchants may pay up to 0.80%; enterprise merchants closer to 0.30%. Find it on the interchange line of your statement."
        >
          <div className="flex items-center gap-2">
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
              className="w-24 rounded-lg px-2 py-1 font-mono text-body-sm outline-none min-h-[40px]"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
            <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
          </div>
        </FieldCard>
      )}

      {/* ── Field 3: Commercial card share ────────────────────── */}
      <div
        className="mt-4 rounded-lg"
        style={{ border: '0.5px solid var(--color-border-tertiary)', padding: '12px' }}
      >
        <button
          type="button"
          onClick={() => setCommercialExpanded((v) => !v)}
          className="flex w-full items-center justify-between cursor-pointer"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <span className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {commercialExpanded ? '↑' : '↓'} Corporate / business card share{isB2B ? ' (likely relevant)' : ' (optional)'}
          </span>
          <Badge {...commercialBadge} />
        </button>
        {commercialExpanded && (
          <div className="mt-3">
            <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              Corporate card interchange is UNCHANGED by the reform — raising this share lowers
              your projected saving.
            </p>
            <div className="mt-2 flex items-center gap-2">
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
                className="w-24 rounded-lg px-2 py-1 font-mono text-body-sm outline-none min-h-[40px]"
                style={{
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
              {commercialDelta.label && (
                <span
                  className="font-mono text-caption"
                  style={{
                    color: commercialDelta.positive ? 'var(--color-text-success)' : 'var(--color-text-danger)',
                  }}
                >
                  {commercialDelta.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Field 4: Monthly debit transactions ───────────────── */}
      <FieldCard
        label="Monthly debit card transactions (optional)"
        badge={getBadge('__monthlyDebitTxns', monthlyTxnsEdited, resolutionTrace)}
        chip={<ImpactChip label="Alternative to AVT" tone="neutral" />}
        delta={monthlyTxnsDelta}
        hint="If you'd rather count transactions than guess an average, enter your monthly Visa + Mastercard + eftpos count."
      >
        <div className="flex items-center gap-2">
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
            className="w-32 rounded-lg px-2 py-1 font-mono text-body-sm outline-none min-h-[40px]"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>per month</span>
        </div>
      </FieldCard>

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
  chip: React.ReactNode;
  delta: { label: string; positive: boolean };
  hint: string;
  children: React.ReactNode;
}

function FieldCard({ label, badge, chip, delta, hint, children }: FieldCardProps) {
  return (
    <div
      className="mt-4 rounded-lg"
      style={{ border: '0.5px solid var(--color-border-tertiary)', padding: '12px' }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        <Badge {...badge} />
      </div>
      <div className="mt-1">{chip}</div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {children}
        {delta.label && (
          <span
            className="font-mono text-caption"
            style={{
              color: delta.positive ? 'var(--color-text-success)' : 'var(--color-text-danger)',
            }}
          >
            {delta.label}
          </span>
        )}
      </div>
      <p className="mt-2 text-micro" style={{ color: 'var(--color-text-tertiary)' }}>
        {hint}
      </p>
    </div>
  );
}
