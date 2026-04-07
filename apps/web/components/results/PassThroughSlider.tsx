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
import { trackEvent } from '@/lib/analytics';
import type {
  AssessmentOutputs,
  RawAssessmentData,
  ResolutionContext,
} from '@nosurcharging/calculations/types';

interface PassThroughSliderProps {
  category: 1 | 2 | 3 | 4;
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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pt = parseInt(e.target.value, 10) / 100;

    const start = typeof performance !== 'undefined' ? performance.now() : 0;

    const resolved = resolveAssessmentInputs(
      { ...originalRaw, passThrough: pt },
      resolutionContext,
    );
    const newOutputs = calculateMetrics(resolved);

    if (process.env.NODE_ENV === 'development' && typeof performance !== 'undefined') {
      const elapsed = performance.now() - start;
      if (elapsed > 16) {
        console.warn(
          `[slider] calculateMetrics took ${elapsed.toFixed(1)}ms (>16ms budget)`,
        );
      }
    }

    onOutputsChange(newOutputs, pt);

    if (!sliderUsedTracked.current) {
      trackEvent('Slider used');
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
          fontSize: '9px',
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
        The key variable is how much of the {formatDollar(outputs.icSaving)}{' '}
        processing cost reduction is reflected in your {pspName} rate after
        October.
      </p>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={pctValue}
        onInput={handleInput as unknown as React.FormEventHandler<HTMLInputElement>}
        className="w-full"
        style={{ accentColor: '#1A6B5A' }}
        aria-label="Pass-through percentage"
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

      {/* Result box — accent-light bg, accent-border */}
      <div
        style={{
          background: '#EBF6F3',
          border: '1px solid #72C4B0',
          padding: '12px 14px',
          marginTop: '14px',
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
