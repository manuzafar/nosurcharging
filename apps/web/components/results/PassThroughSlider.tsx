'use client';

// CB-08: Pass-through slider. Categories 2 and 4 only.
// Range: 0-100%, step 1, initial 0%.
// accent-color: #1A6B5A
//
// On every input event — all updates in one synchronous pass:
//   1. Read slider value
//   2. resolveAssessmentInputs with updated passThrough
//   3. calculateMetrics with resolved inputs
//   4. onOutputsChange(newOutputs) — parent re-renders all children
//
// Performance: <16ms per calculateMetrics call.
// Console.warn if exceeded in development.

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

export function PassThroughSlider({
  category,
  passThrough,
  outputs,
  originalRaw,
  resolutionContext,
  pspName,
  onOutputsChange,
}: PassThroughSliderProps) {
  // Fire Slider used event once per mount — not per input event
  const sliderUsedTracked = useRef(false);

  // Only visible for categories 2 and 4
  if (category !== 2 && category !== 4) return null;

  const pctValue = Math.round(passThrough * 100);
  const savingAmount = Math.round(outputs.icSaving * passThrough);

  const formatDollar = (v: number) =>
    '$' + v.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pt = parseInt(e.target.value, 10) / 100;

    // Performance measurement in development
    const start = typeof performance !== 'undefined' ? performance.now() : 0;

    // Resolve → calculate — single synchronous pass
    const resolved = resolveAssessmentInputs(
      { ...originalRaw, passThrough: pt },
      resolutionContext,
    );
    const newOutputs = calculateMetrics(resolved);

    if (process.env.NODE_ENV === 'development' && typeof performance !== 'undefined') {
      const elapsed = performance.now() - start;
      if (elapsed > 16) {
        console.warn(`[slider] calculateMetrics took ${elapsed.toFixed(1)}ms (>16ms budget)`);
      }
    }

    onOutputsChange(newOutputs, pt);

    // Fire once per mount — not per input event
    if (!sliderUsedTracked.current) {
      trackEvent('Slider used');
      sliderUsedTracked.current = true;
    }
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-body-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            If {pspName} passes through...
          </p>
          <p className="mt-0.5 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Drag to model different outcomes
          </p>
        </div>
        <p
          className="font-mono font-medium shrink-0"
          style={{
            fontSize: '24px',
            color: savingAmount > 0
              ? 'var(--color-text-success)'
              : 'var(--color-text-secondary)',
          }}
        >
          {formatDollar(savingAmount)}
        </p>
      </div>

      {/* Slider row */}
      <div className="mt-3 flex items-center gap-2.5">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={pctValue}
          onInput={handleInput as unknown as React.FormEventHandler<HTMLInputElement>}
          className="flex-1"
          style={{ accentColor: '#1A6B5A' }}
          aria-label="Pass-through percentage"
        />
        <span
          className="font-mono text-caption text-right shrink-0"
          style={{
            minWidth: '28px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {pctValue}%
        </span>
      </div>

      {/* Note */}
      <p
        className="mt-3 rounded-lg px-3 py-2 text-caption"
        style={{
          background: 'var(--color-background-secondary)',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.55',
        }}
      >
        RBA data shows 90% of Australian merchants did not switch PSP last year.
        At 0%, {pspName} keeps the full {formatDollar(Math.round(outputs.icSaving))} IC saving.
      </p>
    </div>
  );
}
