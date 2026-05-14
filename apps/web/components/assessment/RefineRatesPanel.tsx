'use client';

// RefineRatesPanel — Step 2 sub-component per ASSESSMENT_STEP2_REDESIGN_BRIEF_V2.
//
// Renders ONLY when a PSP has been selected. Collapsed by default; click the
// header to expand. Inside the expanded panel:
//   - Flat-rate MSF pre-fill (when planType='flat' && !isUnknown &&
//     PSP_PUBLISHED_RATES[psp] exists) — auto-shown, not collapsible.
//   - Blended debit + credit inputs (when planType='blended' && !isUnknown) —
//     auto-shown, not collapsible.
//   - Card mix nested expandable (existing CardMixInput component).
//   - Expert rates nested expandable (existing ExpertPanel component).
//
// When isUnknown=true, only the card-mix nested expandable is offered — the
// auto-shown rate inputs and the expert panel are suppressed.
//
// The three rate inputs (MSF, blended debit, blended credit) use a local
// draft-string buffer so the user can clear the field and retype freely. The
// previous controlled `value={Number((rate*100).toFixed(2))}` + drop-on-NaN
// pattern made it impossible to clear a single-digit value once entered —
// every Backspace produced an empty string, the guard rejected it, and React
// snapped the displayed value back to the last accepted state. See useNumericDraft
// below for the new pattern: local string state, validate-on-blur, snap back
// to the last valid value only on commit, not on every keystroke.

import { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ExpertPanel } from './ExpertPanel';
import { CardMixInput } from './CardMixInput';
import type {
  MerchantInputOverrides,
  CardMixInput as CardMixInputType,
} from '@nosurcharging/calculations/types';
import {
  PSP_PUBLISHED_RATES,
  PSP_RATES_AS_OF,
} from '@nosurcharging/calculations/constants/psp-rates';

// ── Props ────────────────────────────────────────────────────────────────

interface RefineRatesPanelProps {
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate' | null;
  isUnknown: boolean;
  psp: string;
  msfRate: number;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  merchantInput: MerchantInputOverrides;
  onMsfRateChange: (rate: number) => void;
  onBlendedRatesChange: (debit: number | null, credit: number | null) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  // Display label for the PSP (e.g. 'Other' → 'your payment provider' via
  // displayPspName upstream). Used in the "Your {psp} rate" copy.
  pspDisplayLabel: string;
}

// ── Numeric-draft hook ───────────────────────────────────────────────────
//
// Owns the visible input string for a controlled numeric field, and pushes
// to parent state only when the parsed value is valid + in range. On blur,
// snaps the draft back to the canonical formatting of the last valid value
// — or to empty if the field accepts null. Solves the "stuck on `1`" bug
// where Backspace produces an empty string that gets dropped by a positive-
// number guard and snaps the display back.
//
// Sync against `value`: only writes to the draft when the parent value
// genuinely differs from what the draft already represents (parsed equality,
// so "1.40" === 1.4 doesn't stomp the user's in-progress decimals).

interface UseNumericDraftOpts {
  value: number | null;
  onChange: (next: number | null) => void;
  min: number;
  max: number;
  decimals?: number;
  allowNull?: boolean;
}

function useNumericDraft({
  value,
  onChange,
  min,
  max,
  decimals = 2,
  allowNull = false,
}: UseNumericDraftOpts) {
  const format = (v: number | null) =>
    v === null ? '' : v.toFixed(decimals);
  const [draft, setDraft] = useState<string>(() => format(value));

  // Sync when the parent value updates from outside (e.g. PSP picker
  // pre-fills a new MSF rate). Skip when the draft already represents this
  // number — prevents the effect from stomping a mid-edit value like "1.".
  useEffect(() => {
    const draftNum = parseFloat(draft);
    const parentNum = value === null ? NaN : value;
    if (Number.isNaN(draftNum) && Number.isNaN(parentNum)) return;
    if (draftNum === parentNum) return;
    setDraft(format(value));
  }, [value, decimals]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDraft(next);
    if (next === '') {
      if (allowNull) onChange(null);
      return;
    }
    const v = parseFloat(next);
    if (!Number.isNaN(v) && v >= min && v <= max) onChange(v);
  };

  const handleBlur = () => {
    if (draft === '') {
      if (allowNull) return;
      setDraft(format(value));
      return;
    }
    const v = parseFloat(draft);
    if (Number.isNaN(v) || v < min || v > max) {
      setDraft(format(value));
    } else {
      setDraft(v.toFixed(decimals));
    }
  };

  return { draft, onChange: handleChange, onBlur: handleBlur };
}

// ── Main component ────────────────────────────────────────────────────────

export function RefineRatesPanel({
  planType,
  isUnknown,
  psp,
  msfRate,
  blendedDebitRate,
  blendedCreditRate,
  merchantInput,
  onMsfRateChange,
  onBlendedRatesChange,
  onMerchantInputChange,
  pspDisplayLabel,
}: RefineRatesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const showFlatInput =
    planType === 'flat' && !isUnknown && PSP_PUBLISHED_RATES[psp] !== undefined;
  const showBlendedInputs = planType === 'blended' && !isUnknown;
  const showExpertPanel = !isUnknown;

  const subtitle = isUnknown
    ? "Optional. You picked 'Not sure' — we'll use defaults unless you override below."
    : 'Optional. Helps tighten your impact estimate.';

  return (
    <div
      style={{
        background: 'rgba(235, 246, 243, 0.4)',
        border: '0.5px solid rgba(114, 196, 176, 0.35)',
        borderRadius: '12px',
        padding: '18px 22px',
        marginTop: '24px',
      }}
    >
      {/* Header — click to toggle. The whole row is the trigger. */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center justify-between text-left"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          gap: '12px',
        }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="font-medium"
            style={{ fontSize: '14px', color: '#1A1409', lineHeight: 1.35 }}
          >
            Refine my rates (optional)
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(26, 20, 9, 0.6)',
              marginTop: '3px',
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </div>
        <ChevronDown
          size={18}
          aria-hidden
          style={{
            color: 'rgba(26, 20, 9, 0.55)',
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {expanded && (
        <div id={panelId} style={{ marginTop: '18px' }}>
          {showFlatInput && (
            <FlatRateInput
              psp={psp}
              pspDisplayLabel={pspDisplayLabel}
              msfRate={msfRate}
              onChange={onMsfRateChange}
            />
          )}

          {showBlendedInputs && (
            <BlendedRateInputs
              debitRate={blendedDebitRate}
              creditRate={blendedCreditRate}
              onChange={onBlendedRatesChange}
            />
          )}

          {/* Card mix — always shown inside Refine, including for isUnknown.
              Internal collapse is owned by the CardMixInput component. */}
          <div
            className="[&>div]:!mt-0"
            style={{
              marginTop:
                showFlatInput || showBlendedInputs ? '16px' : 0,
            }}
          >
            <CardMixInput
              value={merchantInput.cardMix ?? {}}
              onChange={(mix: CardMixInputType) =>
                onMerchantInputChange({ ...merchantInput, cardMix: mix })
              }
            />
          </div>

          {/* Expert rates — suppressed for isUnknown per brief §4. */}
          {showExpertPanel && (
            <div className="[&>div]:!mt-0" style={{ marginTop: '12px' }}>
              <ExpertPanel
                expertRates={merchantInput.expertRates}
                onChange={(rates) =>
                  onMerchantInputChange({ ...merchantInput, expertRates: rates })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Flat-rate MSF pre-fill ────────────────────────────────────────────────

function FlatRateInput({
  psp,
  pspDisplayLabel,
  msfRate,
  onChange,
}: {
  psp: string;
  pspDisplayLabel: string;
  msfRate: number;
  onChange: (rate: number) => void;
}) {
  const { draft, onChange: handleChange, onBlur: handleBlur } = useNumericDraft({
    value: msfRate * 100,
    onChange: (v) => {
      if (v !== null) onChange(v / 100);
    },
    min: 0.1,
    max: 5,
    decimals: 2,
    allowNull: false,
  });
  const inputId = useId();

  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid rgba(26, 20, 9, 0.12)',
        borderRadius: '10px',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: '12px' }}>
        <label
          htmlFor={inputId}
          className="font-medium"
          style={{ fontSize: '13px', color: '#1A1409' }}
        >
          Your {pspDisplayLabel} rate
        </label>
        <span
          className="inline-block rounded-pill"
          style={{
            padding: '2px 8px',
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-tertiary)',
            border: '0.5px solid var(--color-border-tertiary)',
            fontSize: '10px',
            fontWeight: 500,
          }}
        >
          {psp} standard rate — confirm or update
        </span>
      </div>
      <p
        className="mt-1"
        style={{
          fontSize: '12px',
          color: 'rgba(26, 20, 9, 0.55)',
          lineHeight: 1.5,
        }}
      >
        Published {PSP_RATES_AS_OF}. Verify with your payment provider for your
        specific rate.
      </p>
      <div className="mt-3 flex items-center" style={{ gap: '8px' }}>
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={handleChange}
          onBlur={handleBlur}
          className="font-mono outline-none"
          style={{
            width: '88px',
            padding: '6px 10px',
            borderRadius: '8px',
            border: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            fontSize: '14px',
            minHeight: '38px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          %
        </span>
      </div>
    </div>
  );
}

// ── Blended debit + credit inputs ─────────────────────────────────────────

function BlendedRateInputs({
  debitRate,
  creditRate,
  onChange,
}: {
  debitRate: number | null;
  creditRate: number | null;
  onChange: (debit: number | null, credit: number | null) => void;
}) {
  const debit = useNumericDraft({
    value: debitRate !== null ? debitRate * 100 : null,
    onChange: (v) =>
      onChange(v === null ? null : v / 100, creditRate),
    min: 0,
    max: 5,
    decimals: 2,
    allowNull: true,
  });
  const credit = useNumericDraft({
    value: creditRate !== null ? creditRate * 100 : null,
    onChange: (v) =>
      onChange(debitRate, v === null ? null : v / 100),
    min: 0,
    max: 5,
    decimals: 2,
    allowNull: true,
  });

  const debitId = useId();
  const creditId = useId();

  return (
    <div
      style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid rgba(26, 20, 9, 0.12)',
        borderRadius: '10px',
        padding: '14px 16px',
      }}
    >
      <p
        className="font-medium"
        style={{ fontSize: '13px', color: '#1A1409' }}
      >
        Your blended rates
      </p>
      <p
        className="mt-1"
        style={{
          fontSize: '12px',
          color: 'rgba(26, 20, 9, 0.55)',
          lineHeight: 1.5,
        }}
      >
        Find on your monthly statement. Leave blank to use market averages.
      </p>
      <div className="mt-3 flex flex-wrap" style={{ gap: '20px' }}>
        <div>
          <label
            htmlFor={debitId}
            className="block font-medium uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px',
            }}
          >
            Debit
          </label>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <input
              id={debitId}
              type="text"
              inputMode="decimal"
              placeholder="0.9"
              value={debit.draft}
              onChange={debit.onChange}
              onBlur={debit.onBlur}
              className="font-mono outline-none"
              style={{
                width: '88px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                minHeight: '38px',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              %
            </span>
          </div>
        </div>
        <div>
          <label
            htmlFor={creditId}
            className="block font-medium uppercase"
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px',
            }}
          >
            Credit
          </label>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <input
              id={creditId}
              type="text"
              inputMode="decimal"
              placeholder="1.6"
              value={credit.draft}
              onChange={credit.onChange}
              onBlur={credit.onBlur}
              className="font-mono outline-none"
              style={{
                width: '88px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                minHeight: '38px',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
