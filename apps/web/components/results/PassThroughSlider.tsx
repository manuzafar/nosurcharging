'use client';

// PassThroughSlider — per ux-spec §3.6.
// Categories 2 and 4 only — internally gates.
//
// Lets the merchant model how much of the IC saving is reflected in
// their flat rate after October. The slider drives a single
// resolve→calculate pass on every input event; parent re-renders all
// children with the fresh outputs.
//
// Banned: "Stripe keeps all of it" / "your PSP" / "your provider".
// Use: "Not reflected in your rate" / explicit pspName.

import { useRef } from 'react';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import { Analytics } from '@/lib/analytics';
import type {
  AssessmentOutputs,
  RawAssessmentData,
  ResolutionContext,
} from '@nosurcharging/calculations/types';

interface PassThroughSliderProps {
  category: 1 | 2 | 3 | 4 | 5;
  passThrough: number;
  outputs: AssessmentOutputs;
  originalRaw: RawAssessmentData;
  resolutionContext: ResolutionContext;
  pspName: string;
  onOutputsChange: (outputs: AssessmentOutputs, passThrough: number) => void;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

export function PassThroughSlider({
  category,
  passThrough,
  outputs,
  originalRaw,
  resolutionContext,
  pspName,
  onOutputsChange,
}: PassThroughSliderProps) {
  const sliderUsedTracked = useRef(false);

  if (category !== 2 && category !== 4) return null;

  const pctValue = Math.round(passThrough * 100);
  const reflectedSaving = Math.round(outputs.icSaving * passThrough);
  const netImpact = outputs.plSwing;
  const netCostFromOct = outputs.octNet;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pt = parseInt(e.target.value, 10) / 100;

    const resolved = resolveAssessmentInputs(
      { ...originalRaw, passThrough: pt },
      resolutionContext,
    );
    const newOutputs = calculateMetrics(resolved);

    onOutputsChange(newOutputs, pt);

    if (!sliderUsedTracked.current) {
      Analytics.sliderUsed({ category, pass_through_pct: Math.round(pt * 100) });
      sliderUsedTracked.current = true;
    }
  };

  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      {/* Section eyebrow */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '2.5px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '12px',
        }}
      >
        Model your outcome
      </p>

      {/* Intro */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          marginBottom: '16px',
        }}
      >
        Our central scenario assumes ~45% pass-through — the actual figure depends on {pspName}.
        At 0%, the full {formatDollar(outputs.icSaving)} interchange saving stays with {pspName}.
        At 100%, it passes through entirely.
      </p>

      {/* Slider — controlled input uses onChange so React's controlled-input
          plumbing hooks correctly. Using onInput without onChange made React
          treat the field as read-only and re-sync the DOM value on every
          render, which caused visible jumps while dragging.

          a11y: native <input type="range"> already exposes role=slider and
          aria-valuenow via the `value` attribute, but we set aria-valuetext
          to give screen readers a meaningful phrase ("50 percent — half of
          the interchange saving reflected in your Stripe rate") instead of
          the bare number. aria-valuemin/max are explicit for AT that don't
          derive them from min/max props. */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pctValue}
        onChange={handleChange}
        className="w-full"
        style={{ accentColor: '#1A6B5A' }}
        aria-label={`Pass-through percentage — how much of the interchange saving is reflected in your ${pspName} rate`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pctValue}
        aria-valuetext={
          pctValue === 0
            ? `0 percent — none of the saving reflected in your ${pspName} rate`
            : pctValue === 100
              ? `100 percent — the full saving reflected in your ${pspName} rate`
              : `${pctValue} percent of the saving reflected in your ${pspName} rate`
        }
      />

      {/* Slider labels (per spec) */}
      <div
        className="flex justify-between"
        style={{
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          marginTop: '4px',
        }}
      >
        <span>Not reflected in your rate (0%)</span>
        <span className="font-mono">{pctValue}%</span>
        <span>Fully reflected (100%)</span>
      </div>

      {/* Result box — accent-light bg, accent-border, 8px radius
          (structured content on the 8px tier of the Modern Fintech Hierarchy). */}
      <div
        style={{
          background: '#EBF6F3',
          border: '1px solid #72C4B0',
          padding: '12px 14px',
          marginTop: '14px',
          borderRadius: '8px',
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Cost reduction in your {pspName} rate
          </span>
          <span
            className="font-mono font-medium"
            style={{ fontSize: '13px', color: 'var(--color-text-success)' }}
          >
            +{formatDollar(reflectedSaving)}/yr
          </span>
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Your net annual impact
          </span>
          <span
            className="font-mono font-medium"
            style={{
              fontSize: '13px',
              color: netImpact >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)',
            }}
          >
            {netImpact >= 0 ? '+' : '−'}
            {formatDollar(netImpact)}/yr
          </span>
        </div>

        <div
          className="flex items-center justify-between"
          style={{
            paddingTop: '6px',
            borderTop: '0.5px solid #72C4B0',
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Net cost from October
          </span>
          <span
            className="font-mono font-medium"
            style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
          >
            {formatDollar(netCostFromOct)}/yr
          </span>
        </div>
      </div>
    </section>
  );
}
