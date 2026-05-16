'use client';

// Step 2 — single radio list of six equal-weight plan-type options, plus a
// 3-column desktop / 2-column mobile PSP grid, plus a "Refine my rates"
// expandable that holds every conditional rate input.
//
// Per ASSESSMENT_STEP2_REDESIGN_BRIEF_V2.md (May 2026). Supersedes the
// v1 Tier 1 / Tier 2 / Tier 3 structure with HairlineDividers and per-card
// MockBar/TechTag chrome — May 2026 user testing showed merchants
// perceived the three tiers as three separate questions and silently
// deselected previous choices when clicking across them.
//
// What stays identical: planType enum values, all callback signatures
// (onPlanTypeChange(pt, unknown?), onStrategicRateSelected, onPspChange,
// onMsfRateChange, onBlendedRatesChange, onMerchantInputChange,
// onNext, onBack), PSP_OPTIONS keys, design-system tokens (emerald
// #1A6B5A, paper background, button vocabulary).

import { useState } from 'react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';
import { RefineRatesPanel } from './RefineRatesPanel';
import { displayPspName } from '@nosurcharging/calculations';
import type { MerchantInputOverrides } from '@nosurcharging/calculations/types';

// ── Constants ─────────────────────────────────────────────────────────────

// PSP_OPTIONS keys — values that flow into ResolvedAssessmentInputs.psp and
// every analytics event. Unchanged from v1; the brief only reformats display
// labels for 'ANZ' → 'ANZ Worldline' and 'Other' → 'Other / Not listed'.
const PSP_OPTIONS = [
  'Stripe', 'Square', 'Tyro', 'CommBank', 'ANZ', 'Westpac', 'Zeller', 'eWAY', 'Adyen', 'Other',
] as const;

// Grid display order per brief — different from PSP_OPTIONS constant order.
// Named PSPs fill rows 1-3 (desktop 3-col) / rows 1-5 (mobile 2-col); 'Other'
// spans the full bottom row.
const PSP_GRID_ORDER: ReadonlyArray<string> = [
  'Stripe', 'Square', 'Tyro',
  'Zeller', 'Adyen', 'eWAY',
  'CommBank', 'ANZ', 'Westpac',
] as const;

// Display label overrides per brief. Keys unchanged; only the rendered text
// differs.
function pspDisplayLabel(key: string): string {
  if (key === 'ANZ') return 'ANZ Worldline';
  if (key === 'Other') return 'Other / Not listed';
  return key;
}

// Six plan-type options in the locked brief order. The 'unknown' option uses
// planType='flat' upstream with the isUnknown flag set — the parent stores
// the flag separately so downstream calculations get sensible defaults.
type PlanOptionKey =
  | 'flat'
  | 'unknown'
  | 'costplus'
  | 'blended'
  | 'zero_cost'
  | 'strategic_rate';

interface PlanOption {
  key: PlanOptionKey;
  title: string;
  subtitle: string;
  chip?: { label: string; variant: 'success' | 'info' };
}

const PLAN_OPTIONS: ReadonlyArray<PlanOption> = [
  {
    key: 'flat',
    title: 'Single rate (flat %)',
    subtitle: 'One fixed percentage on all transactions',
    chip: { label: 'Most common', variant: 'success' },
  },
  {
    key: 'unknown',
    title: 'Not sure',
    subtitle: "We'll use typical rates for your provider",
    chip: { label: 'Smart defaults', variant: 'info' },
  },
  {
    key: 'costplus',
    title: 'IC++ (Interchange Plus)',
    subtitle: 'Interchange + scheme fee + acquirer margin, itemised',
  },
  {
    key: 'blended',
    title: 'Blended',
    subtitle: 'Different rates for different card types',
  },
  {
    key: 'zero_cost',
    title: 'Zero-cost EFTPOS',
    subtitle: 'Your customer pays a surcharge, you pay nothing',
  },
  {
    key: 'strategic_rate',
    title: 'Strategic / custom',
    subtitle: 'Negotiated enterprise pricing',
  },
];

// ── Props ────────────────────────────────────────────────────────────────

interface Step2PlanTypeProps {
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate' | null;
  msfRateMode: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate: number | null;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  volume?: number;
  msfRate: number;
  onMsfRateChange: (rate: number) => void;
  onPlanTypeChange: (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost', unknown?: boolean) => void;
  onMsfRateModeChange: (mode: 'unselected' | 'market_estimate' | 'custom') => void;
  onCustomMSFRateChange: (rate: number | null) => void;
  onBlendedRatesChange: (debit: number | null, credit: number | null) => void;
  onStrategicRateSelected: () => void;
  onPspChange: (psp: string) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  onNext: () => void;
  onBack: () => void;
}

// ── Small UI primitives ──────────────────────────────────────────────────

// 20px circle on the right of each plan-type card. Selected = emerald fill
// with a white inner dot; unselected = paper-tinted hairline border.
function RadioDot({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: '19px',
        right: '22px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: isSelected ? '1.5px solid #1A6B5A' : '1.5px solid rgba(26, 20, 9, 0.22)',
        background: isSelected ? '#1A6B5A' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 120ms ease',
        flexShrink: 0,
      }}
    >
      {isSelected && (
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#FFFFFF',
          }}
        />
      )}
    </span>
  );
}

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: 'success' | 'info';
}) {
  const styles =
    variant === 'success'
      ? {
          background: '#EBF6F3',
          color: '#1A6B5A',
          border: '0.5px solid #72C4B0',
        }
      : {
          background: '#E6F1FB',
          color: '#185FA5',
          border: '0.5px solid #85B7EB',
        };
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: '10px',
        letterSpacing: '0.08em',
        padding: '4px 10px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        ...styles,
      }}
    >
      {label}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export function Step2PlanType({
  planType,
  blendedDebitRate,
  blendedCreditRate,
  psp,
  merchantInput,
  msfRate,
  onMsfRateChange,
  onPlanTypeChange,
  onBlendedRatesChange,
  onStrategicRateSelected,
  onPspChange,
  onMerchantInputChange,
  onNext,
  onBack,
}: Step2PlanTypeProps) {
  // Local state — isUnknown rides alongside planType='flat' for the
  // "Not sure" cohort; strategicSelected is a UI flag for the radio-card
  // representation of the strategic_rate path. Both flags are derived
  // from the same single radio group, so only one can be true at a time.
  const [isUnknown, setIsUnknown] = useState(false);
  const [strategicSelected, setStrategicSelected] = useState(false);

  // Selection helpers — `selectedOptionKey` is the single source of truth
  // for which of the six radio cards is currently active.
  const selectedOptionKey: PlanOptionKey | null = strategicSelected
    ? 'strategic_rate'
    : isUnknown
      ? 'unknown'
      : planType === null
        ? null
        : (planType as PlanOptionKey);

  const handleOptionSelect = (key: PlanOptionKey) => {
    if (key === 'strategic_rate') {
      setStrategicSelected(true);
      setIsUnknown(false);
      return;
    }
    if (key === 'unknown') {
      setIsUnknown(true);
      setStrategicSelected(false);
      onPlanTypeChange('flat', true);
      return;
    }
    setIsUnknown(false);
    setStrategicSelected(false);
    onPlanTypeChange(key, false);
  };

  // Strategic-rate path short-circuits the assessment — Continue routes to
  // the strategic-rate exit page rather than Step 3.
  const handleNext = () => {
    if (strategicSelected) {
      onStrategicRateSelected();
    } else {
      onNext();
    }
  };

  const canProceed =
    strategicSelected || (planType !== null && psp !== null);

  return (
    <div>
      {/* Eyebrow — section name, not the step counter (the page-level
          ProgressBar + StepCounter already cover that). */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '0.14em',
          color: '#1A6B5A',
        }}
      >
        How you pay
      </p>

      <h2
        className="mt-2 font-serif text-ink"
        style={{
          fontSize: 'clamp(28px, 5vw, 38px)',
          fontWeight: 400,
          letterSpacing: '-0.025em',
          lineHeight: 1.12,
        }}
      >
        How do you pay for card acceptance?
      </h2>

      <p
        className="mt-3"
        style={{
          fontSize: 'clamp(14px, 1.6vw, 15px)',
          lineHeight: 1.55,
          color: 'rgba(26, 20, 9, 0.65)',
          maxWidth: '580px',
        }}
      >
        This helps us estimate your current cost structure and project the
        impact.
      </p>

      {/* ── Pricing model — single radio list, six equal-weight cards ── */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '0.14em',
          color: 'var(--color-text-tertiary)',
          marginTop: '36px',
          marginBottom: '14px',
        }}
      >
        Pricing model
      </p>

      <div
        role="radiogroup"
        aria-label="Pricing model"
        className="flex flex-col"
        style={{ gap: '8px' }}
      >
        {PLAN_OPTIONS.map((option) => {
          const isSelected = selectedOptionKey === option.key;
          return (
            <div
              key={option.key}
              role="radio"
              aria-checked={isSelected}
              aria-label={option.title}
              tabIndex={0}
              onClick={() => handleOptionSelect(option.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionSelect(option.key);
                }
              }}
              className="relative cursor-pointer rounded-xl"
              style={{
                background: isSelected ? '#EBF6F3' : '#FFFFFF',
                border: isSelected
                  ? '1.5px solid #1A6B5A'
                  : '0.5px solid rgba(26, 20, 9, 0.16)',
                padding: '18px 64px 18px 22px',
                transition: 'all 120ms ease',
              }}
            >
              <div className="flex items-start justify-between" style={{ gap: '12px' }}>
                <div className="min-w-0 flex-1">
                  <p
                    className="font-medium"
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.35,
                      color: '#1A1409',
                    }}
                  >
                    {option.title}
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.45,
                      color: 'rgba(26, 20, 9, 0.6)',
                      marginTop: '3px',
                    }}
                  >
                    {option.subtitle}
                  </p>
                </div>
                {option.chip && (
                  <Chip label={option.chip.label} variant={option.chip.variant} />
                )}
              </div>
              <RadioDot isSelected={isSelected} />
            </div>
          );
        })}
      </div>

      {/* ── Payment provider — 3-col desktop, 2-col mobile, Other full-width ── */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '0.14em',
          color: 'var(--color-text-tertiary)',
          marginTop: '36px',
          marginBottom: '14px',
        }}
      >
        Payment provider
      </p>

      <div
        role="radiogroup"
        aria-label="Payment provider"
        className="grid grid-cols-2 min-[501px]:grid-cols-3"
        style={{ gap: '8px' }}
      >
        {PSP_GRID_ORDER.map((key) => {
          const selected = psp === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (psp === null && key === PSP_GRID_ORDER[0]) ? 0 : -1}
              onClick={() => onPspChange(key)}
              className="text-center cursor-pointer"
              style={{
                background: selected ? '#EBF6F3' : '#FFFFFF',
                border: selected
                  ? '1.5px solid #1A6B5A'
                  : '0.5px solid rgba(26, 20, 9, 0.16)',
                color: selected ? '#1A6B5A' : '#1A1409',
                fontSize: '14px',
                fontWeight: 500,
                padding: '18px 12px',
                borderRadius: '12px',
                transition: 'all 120ms ease',
              }}
            >
              {pspDisplayLabel(key)}
            </button>
          );
        })}
        {/* Other / Not listed — full-width bottom row, lighter weight when
            unselected to signal it's the fallback option. */}
        <button
          type="button"
          role="radio"
          aria-checked={psp === 'Other'}
          tabIndex={psp === 'Other' ? 0 : -1}
          onClick={() => onPspChange('Other')}
          className="text-center cursor-pointer"
          style={{
            gridColumn: '1 / -1',
            background: psp === 'Other' ? '#EBF6F3' : '#FFFFFF',
            border:
              psp === 'Other'
                ? '1.5px solid #1A6B5A'
                : '0.5px solid rgba(26, 20, 9, 0.16)',
            color: psp === 'Other' ? '#1A6B5A' : 'rgba(26, 20, 9, 0.6)',
            fontSize: '14px',
            fontWeight: psp === 'Other' ? 500 : 400,
            padding: '18px 12px',
            borderRadius: '12px',
            transition: 'all 120ms ease',
          }}
        >
          {pspDisplayLabel('Other')}
        </button>
      </div>

      {/* ── Refine my rates — gated on PSP being selected ──────────── */}
      {psp !== null && (
        <RefineRatesPanel
          planType={planType}
          isUnknown={isUnknown}
          psp={psp}
          msfRate={msfRate}
          blendedDebitRate={blendedDebitRate}
          blendedCreditRate={blendedCreditRate}
          merchantInput={merchantInput}
          onMsfRateChange={onMsfRateChange}
          onBlendedRatesChange={onBlendedRatesChange}
          onMerchantInputChange={onMerchantInputChange}
          pspDisplayLabel={displayPspName(psp)}
        />
      )}

      {/* PSP_OPTIONS sanity — guards against the constant drifting from the
          grid-order list. Catches accidental key changes during refactor. */}
      {process.env.NODE_ENV !== 'production' &&
        PSP_OPTIONS.length !== PSP_GRID_ORDER.length + 1 && (
          <span aria-hidden style={{ display: 'none' }}>
            PSP_OPTIONS / PSP_GRID_ORDER length mismatch
          </span>
        )}

      <div
        className="flex items-center justify-between"
        style={{ marginTop: '40px' }}
      >
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={handleNext} disabled={!canProceed}>
          Continue
        </AccentButton>
      </div>
    </div>
  );
}
