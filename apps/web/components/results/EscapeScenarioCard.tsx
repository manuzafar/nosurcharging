'use client';

// EscapeScenarioCard — per ux-spec §3.7. Categories 2 and 4 only.
// Single green box (no twin cards) showing how much the merchant would
// save by switching to the PSP's itemised plan, where the IC saving
// flows through automatically.
//
// Banned: "no negotiation needed" / "your PSP" / "your provider".
// Use: "flows through automatically" / explicit pspName.

import { useMemo } from 'react';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import type {
  AssessmentOutputs,
  RawAssessmentData,
  ResolutionContext,
} from '@nosurcharging/calculations/types';

interface EscapeScenarioCardProps {
  category: 1 | 2 | 3 | 4;
  outputs: AssessmentOutputs;
  passThrough: number;
  originalRaw: RawAssessmentData;
  resolutionContext: ResolutionContext;
  pspName: string;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

export function EscapeScenarioCard({
  category,
  outputs,
  originalRaw,
  resolutionContext,
  pspName,
}: EscapeScenarioCardProps) {
  // Cost-plus escape — calculated ONCE on mount.
  const costPlusOctNet = useMemo(() => {
    if (category !== 2 && category !== 4) return 0;
    const costPlusResolved = resolveAssessmentInputs(
      { ...originalRaw, planType: 'costplus', passThrough: 1.0 },
      resolutionContext,
    );
    return calculateMetrics(costPlusResolved).octNet;
  }, [originalRaw, resolutionContext, category]);

  if (category !== 2 && category !== 4) return null;

  const saving = Math.abs(outputs.octNet - costPlusOctNet);

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
        Is there a better option?
      </p>

      {/* Intro */}
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          marginBottom: '14px',
        }}
      >
        {pspName} also offers an itemised plan where interchange and scheme
        fees are shown separately. When the RBA cuts wholesale costs, the
        reduction flows through automatically — it doesn&apos;t depend on a
        rate review.
      </p>

      {/* Green box — 12px wrapper card tier (it's the main structural card
          of the section, containing a heading + hero number + body copy). */}
      <div
        style={{
          background: '#E8F5EB',
          border: '1px solid rgba(39, 80, 10, 0.25)',
          padding: '16px 18px',
          borderRadius: '12px',
        }}
      >
        <p
          className="font-medium"
          style={{
            fontSize: '12px',
            color: 'var(--color-text-success)',
            marginBottom: '4px',
          }}
        >
          Switching to {pspName}&apos;s itemised plan saves you:
        </p>

        <p
          className="font-mono font-medium"
          style={{
            fontSize: '24px',
            color: 'var(--color-text-success)',
            letterSpacing: '-1px',
            marginBottom: '8px',
          }}
        >
          {formatDollar(saving)}/year
        </p>

        <p
          style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
          }}
        >
          Your net cost would be{' '}
          <span className="font-mono">{formatDollar(costPlusOctNet)}</span>{' '}
          instead of{' '}
          <span className="font-mono">{formatDollar(outputs.octNet)}</span> —
          the full saving flows automatically at 100%.
        </p>
      </div>
    </section>
  );
}
