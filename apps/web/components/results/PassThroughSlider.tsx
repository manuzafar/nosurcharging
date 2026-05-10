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

import { useRef, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Calculator } from 'lucide-react';
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
    // Editorial M3: no card wrapper. The slider + result rows sit
    // directly inside the page column. Hairline rows replace the
    // previous tinted result box.
    <section>
      {/* Eyebrow ("Model your outcome") moved out to page-level SectionHeader. */}

      {/* Intro */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          marginBottom: '18px',
          maxWidth: '540px',
        }}
      >
        Our central scenario assumes ~45% pass-through — the actual figure depends on {pspName}.
        At 0%, the full {formatDollar(outputs.icSaving)} interchange saving stays with {pspName}.
        At 100%, it passes through entirely.
      </p>

      {/* Centre marker pill — small emerald pill above the slider so the
          "centre estimate" reading is always visible while the slider moves. */}
      <div style={{ marginBottom: '10px' }}>
        <span
          className="inline-block font-mono"
          style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.04em',
            padding: '3px 9px',
            borderRadius: '999px',
            background: 'var(--color-background-success)',
            color: 'var(--color-text-success)',
            border: '0.5px solid rgba(26, 107, 90, 0.25)',
          }}
        >
          Centre · 45%
        </span>
      </div>

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

      {/* Three result rows — hairline-divided settings list with a
          1.5px coloured left-accent + leading icon per row so the trio
          reads as a deliberate result table rather than three flat
          lines. Icon + accent colour reinforce the row's intent
          (cost reduction = emerald, net impact = danger / emerald
          depending on sign, calculated total = neutral). */}
      <div style={{ marginTop: '24px' }}>
        <ResultRow
          icon={<ArrowDownRight size={16} aria-hidden />}
          label={`Cost reduction in your ${pspName} rate`}
          value={`+${formatDollar(reflectedSaving)}/yr`}
          accent="success"
        />
        <ResultRow
          icon={<ArrowUpRight size={16} aria-hidden />}
          label="Your net annual impact"
          value={`${netImpact >= 0 ? '+' : '−'}${formatDollar(netImpact)}/yr`}
          accent={netImpact >= 0 ? 'success' : 'danger'}
        />
        <ResultRow
          icon={<Calculator size={16} aria-hidden />}
          label="Net cost from October"
          value={`${formatDollar(netCostFromOct)}/yr`}
          accent="neutral"
          isLast
        />
      </div>
    </section>
  );
}

// Single hairline-divided result row used by the slider's three-row
// readout. Hairline lives on the bottom; the last row suppresses it.
// Each row carries a 1.5px coloured left border + leading icon
// matching the row's intent.
type ResultAccent = 'success' | 'danger' | 'neutral';

function ResultRow({
  icon,
  label,
  value,
  accent,
  isLast,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: ResultAccent;
  isLast?: boolean;
}) {
  const accentStyles = (() => {
    switch (accent) {
      case 'success':
        return {
          border: 'var(--color-text-success)',
          icon: 'var(--color-text-success)',
          value: 'var(--color-text-success)',
        };
      case 'danger':
        return {
          border: 'var(--color-text-danger)',
          icon: 'var(--color-text-danger)',
          value: 'var(--color-text-danger)',
        };
      case 'neutral':
        return {
          border: 'var(--color-border-secondary)',
          icon: 'var(--color-text-tertiary)',
          value: 'var(--color-text-primary)',
        };
    }
  })();
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '14px 12px',
        borderLeft: `1.5px solid ${accentStyles.border}`,
        // Lighter tertiary token per editorial M3 polish so the three
        // result lines read as a deliberate result table, not as
        // section dividers competing with SectionHeader rules.
        borderBottom: isLast
          ? 'none'
          : '0.5px solid var(--color-border-tertiary)',
      }}
    >
      <span
        className="inline-flex items-center"
        style={{ gap: '10px' }}
      >
        <span aria-hidden style={{ color: accentStyles.icon }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </span>
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: accentStyles.value,
        }}
      >
        {value}
      </span>
    </div>
  );
}

