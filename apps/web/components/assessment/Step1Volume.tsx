'use client';

// Step 1: Annual card turnover.
//
// Per docs/design/ASSESSMENT_STEP1_REDESIGN_BRIEF.md — three input
// methods all driving the same `volume` state:
//   • Big mono value display (click-to-edit) — JetBrains Mono,
//     clamp(44px → 64px). On click, becomes an inline numeric input;
//     on blur, returns to display state. Preserves the keyboard-typing
//     path for power users while making the visual prominent.
//   • Slider — 100K → 25M, $50K step, reusing the PassThroughSlider
//     visual (5px warm track, emerald fill, 20px ringed thumb).
//   • Quick-pick chips — 6 sticky points ($500K · $1M · $2M · $5M ·
//     $10M · $20M), reusing the Step 2 PSP-pill visual with JetBrains
//     Mono 13px chip text. Active when value matches exactly.
//
// Annual ↔ Monthly toggle changes the *displayed unit only*. Internally
// we always store an annual figure. When on Monthly, slider × 12 =
// stored annual; the display shows annual ÷ 12.
//
// All other elements (buttons, toggle, chip active state visual, slider
// visual) come from existing site primitives — see brief LOCKED list.

import { useEffect, useRef, useState } from 'react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';

interface Step1VolumeProps {
  value: number;
  onChange: (volume: number) => void;
  onNext: () => void;
  onBack: () => void;
}

// Slider range — $50K → $3B. The bottom anchors small-business
// merchants (sub-$30K warning still applies if they type lower) and
// the top reaches conglomerate-scale volume.
//
// Linear-scaled, the meaningful SMB range ($50K → $25M) would occupy
// less than 1% of the slider track. We map slider position to value
// LOGARITHMICALLY so $50K, $1M, $25M, and $3B all sit at sensible
// positions and the thumb moves usefully across the whole range.
const SLIDER_MIN = 50_000;
const SLIDER_MAX = 3_000_000_000;
const SLIDER_POSITIONS = 1000; // 0–1000 positions on the underlying input
const LOG_MIN = Math.log(SLIDER_MIN);
const LOG_MAX = Math.log(SLIDER_MAX);

const QUICK_PICKS: { label: string; value: number }[] = [
  { label: '$500K', value: 500_000 },
  { label: '$1M', value: 1_000_000 },
  { label: '$2M', value: 2_000_000 },
  { label: '$5M', value: 5_000_000 },
  { label: '$10M', value: 10_000_000 },
  { label: '$20M', value: 20_000_000 },
];

function formatDollar(v: number): string {
  return `$${Math.round(v).toLocaleString('en-AU')}`;
}

// Round a raw value to a magnitude-appropriate increment so the
// displayed value reads cleanly as the slider moves:
//   <$100K     → $1K
//   <$1M       → $10K
//   <$10M      → $100K
//   <$100M     → $1M
//   <$1B       → $10M
//   ≥$1B       → $100M
function roundToNiceStep(v: number): number {
  if (v < 100_000) return Math.round(v / 1_000) * 1_000;
  if (v < 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (v < 10_000_000) return Math.round(v / 100_000) * 100_000;
  if (v < 100_000_000) return Math.round(v / 1_000_000) * 1_000_000;
  if (v < 1_000_000_000) return Math.round(v / 10_000_000) * 10_000_000;
  return Math.round(v / 100_000_000) * 100_000_000;
}

function positionToValue(pos: number): number {
  const clamped = Math.max(0, Math.min(SLIDER_POSITIONS, pos));
  const logValue = LOG_MIN + (clamped / SLIDER_POSITIONS) * (LOG_MAX - LOG_MIN);
  return roundToNiceStep(Math.exp(logValue));
}

function valueToPosition(value: number): number {
  const clamped = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, value));
  const logValue = Math.log(clamped);
  return Math.round(((logValue - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SLIDER_POSITIONS);
}

export function Step1Volume({ value, onChange, onNext, onBack }: Step1VolumeProps) {
  const [isMonthly, setIsMonthly] = useState(false);
  const [editing, setEditing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Display value depends on toggle. Internally we always treat
  // `value` as the annual figure. The display + the typed input + the
  // slider all show / consume the toggle-equivalent number.
  const displayValue = isMonthly ? Math.round(value / 12) : value;
  const annualValue = value;
  const monthlyEquivalent = annualValue > 0 ? Math.round(annualValue / 12) : 0;
  const canProceed = annualValue > 0;
  const showWarning = annualValue > 0 && annualValue < 30_000;

  // Auto-focus the inline input when entering edit mode. We select the
  // current text so a keyboard user can type a new value immediately
  // without clearing first.
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const handleDisplayValueChange = (next: number) => {
    const safe = Math.max(0, Math.round(next));
    const annual = isMonthly ? safe * 12 : safe;
    onChange(annual);
  };

  const handleToggle = (monthly: boolean) => {
    setIsMonthly(monthly);
    // No need to flip the stored value — it's always annual. The
    // displayed number recomputes from `value` on the next render.
  };

  const handleEditInputChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10) || 0;
    handleDisplayValueChange(num);
  };

  // Slider operates on a logarithmic position (0–1000). The current
  // displayValue maps back to a position so the thumb stays in sync
  // when the merchant clicks a chip or types a value.
  const sliderPosition = valueToPosition(displayValue || SLIDER_MIN);
  const sliderPct = (sliderPosition / SLIDER_POSITIONS) * 100;
  const sliderValue = positionToValue(sliderPosition);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = parseInt(e.target.value, 10) || 0;
    handleDisplayValueChange(positionToValue(pos));
  };

  const handleChip = (chipValue: number) => {
    // Chips are always annual figures; the internal store is annual.
    onChange(chipValue);
  };

  const valueMatchesChip = (chipValue: number) => chipValue === annualValue;

  return (
    <div className="flex flex-col">
      {/* Eyebrow + question + helper — unchanged copy. */}
      <p className="text-label tracking-widest text-accent">Step 1</p>
      <h2 className="mt-2 font-serif text-heading-lg">
        How much do you process in card payments?
      </h2>
      <p className="mt-3 text-body-sm text-gray-500">
        Your total annual card turnover — Visa, Mastercard, eftpos, Amex combined.
      </p>

      {/* Annual / Monthly toggle — visual unchanged from previous build. */}
      <div
        role="radiogroup"
        aria-label="Volume reporting period"
        className="mt-7 flex gap-2"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!isMonthly}
          tabIndex={!isMonthly ? 0 : -1}
          onClick={() => handleToggle(false)}
          className={`flex min-h-[44px] items-center justify-center rounded-lg px-5 text-body-sm font-medium transition-colors duration-100 ${
            !isMonthly
              ? 'bg-accent-light text-accent-dark border border-accent'
              : 'text-gray-500 border border-gray-200'
          }`}
        >
          Annual
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={isMonthly}
          tabIndex={isMonthly ? 0 : -1}
          onClick={() => handleToggle(true)}
          className={`flex min-h-[44px] items-center justify-center rounded-lg px-5 text-body-sm font-medium transition-colors duration-100 ${
            isMonthly
              ? 'bg-accent-light text-accent-dark border border-accent'
              : 'text-gray-500 border border-gray-200'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Big mono value display — click-to-edit. The display state is
          a `<button>` so keyboard users can activate it via Enter /
          Space; on click we swap to an `<input>` auto-focused. On
          blur, return to the display state. */}
      <div className="mt-7 flex flex-col items-center text-center">
        {editing ? (
          <input
            ref={editInputRef}
            type="text"
            inputMode="numeric"
            value={displayValue > 0 ? String(displayValue) : ''}
            onChange={(e) => handleEditInputChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            placeholder={isMonthly ? '80000' : '1000000'}
            aria-label={
              isMonthly
                ? 'Monthly card turnover in dollars'
                : 'Annual card turnover in dollars'
            }
            className="font-mono text-center outline-none"
            style={{
              fontSize: 'clamp(44px, 8vw, 64px)',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: 'var(--color-text-primary)',
              background: 'transparent',
              border: 'none',
              maxWidth: '100%',
              width: 'min(100%, 8ch)',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${isMonthly ? 'monthly' : 'annual'} card turnover. Current value ${formatDollar(displayValue)}.`}
            className="font-mono cursor-text"
            style={{
              fontSize: 'clamp(44px, 8vw, 64px)',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color:
                displayValue > 0
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-tertiary)',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            {formatDollar(displayValue)}
          </button>
        )}

        <p
          className="font-mono"
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--color-text-tertiary)',
            letterSpacing: '0.04em',
          }}
        >
          {isMonthly
            ? `per month · approx ${formatDollar(annualValue)} per year`
            : `per year · approx ${formatDollar(monthlyEquivalent)} per month`}
        </p>
      </div>

      {/* Slider — reuses PassThroughSlider's warm track + emerald fill
          + ringed thumb via a small style block below. Range $100K →
          $25M, $50K step. */}
      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={SLIDER_POSITIONS}
          step={1}
          value={sliderPosition}
          onChange={handleSliderChange}
          aria-label={`Card turnover slider, current value ${formatDollar(sliderValue)}`}
          aria-valuetext={formatDollar(sliderValue)}
          className="step1-slider w-full"
          style={
            {
              '--fill': `${sliderPct}%`,
            } as React.CSSProperties
          }
        />
        <div
          className="mt-2 flex items-center justify-between font-mono"
          style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
        >
          <span>$50K</span>
          <span>$3B</span>
        </div>
      </div>

      {/* Quick-pick chips — 6 sticky points. PSP-pill visual + mono
          13px chip text per brief §"Chip styling". */}
      <div
        role="group"
        aria-label="Quick-pick turnover values"
        className="mt-6 flex flex-wrap justify-center"
        style={{ gap: '8px' }}
      >
        {QUICK_PICKS.map((chip) => {
          const active = valueMatchesChip(chip.value);
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleChip(chip.value)}
              aria-pressed={active}
              className="font-mono cursor-pointer transition-all duration-100"
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                border: active
                  ? '1px solid var(--color-accent)'
                  : '0.5px solid var(--color-border-secondary)',
                background: active
                  ? 'var(--color-background-success)'
                  : 'var(--color-background-primary)',
                color: active
                  ? '#0D3D32'
                  : 'var(--color-text-secondary)',
                letterSpacing: '0.02em',
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {showWarning && (
        <p
          className="mt-4 text-body-sm text-accent-dark bg-accent-light rounded-lg px-3 py-2"
          role="status"
        >
          Under $30,000 per year — the interchange saving may be small relative
          to your volume. You can still proceed.
        </p>
      )}

      {/* Actions row */}
      <div className="mt-11 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>

      {/* Slider chrome — same shape as PassThroughSlider but with an
          explicit fill bar driven by the inline `--fill` custom prop.
          Track 5px on the warm token; fill emerald from left to value;
          thumb 20px emerald with a 3px paper ring for legibility. */}
      <style jsx>{`
        .step1-slider {
          appearance: none;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            var(--color-accent) 0%,
            var(--color-accent) var(--fill),
            var(--color-paper-dark) var(--fill),
            var(--color-paper-dark) 100%
          );
          outline: none;
        }
        .step1-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-paper);
          cursor: pointer;
          transition: transform 100ms ease;
        }
        .step1-slider::-webkit-slider-thumb:hover {
          transform: scale(1.05);
        }
        .step1-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-paper);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
