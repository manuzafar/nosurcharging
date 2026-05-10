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
  category: 1 | 2 | 3 | 4 | 5;
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
      {/* Eyebrow ("Is there a better option?") moved out to page-level SectionHeader. */}

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

      {/* Green comparison card — current vs itemised side-by-side, then
          the saving headline below. The "vs" treatment lets the merchant
          eyeball the size of the gap before reading the conclusion. */}
      <div
        style={{
          background: '#E8F5EB',
          border: '1px solid rgba(39, 80, 10, 0.25)',
          padding: '18px 20px',
          borderRadius: '12px',
        }}
      >
        <div
          className="flex items-stretch"
          style={{
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {/* Current */}
          <div className="flex-1">
            <p
              className="uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: 'var(--color-text-tertiary)',
                marginBottom: '4px',
              }}
            >
              Current — {pspName} flat rate
            </p>
            <p
              className="font-mono font-medium"
              style={{
                fontSize: '20px',
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatDollar(outputs.octNet)}/yr
            </p>
          </div>

          {/* "vs" divider */}
          <div
            className="flex items-center"
            aria-hidden
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: '999px',
                background: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-secondary)',
              }}
            >
              vs
            </span>
          </div>

          {/* Itemised */}
          <div className="flex-1 text-right">
            <p
              className="uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: 'var(--color-text-success)',
                marginBottom: '4px',
              }}
            >
              Itemised — flows automatically
            </p>
            <p
              className="font-mono font-medium"
              style={{
                fontSize: '20px',
                color: 'var(--color-text-success)',
                letterSpacing: '-0.4px',
              }}
            >
              {formatDollar(costPlusOctNet)}/yr
            </p>
          </div>
        </div>

        <p
          className="font-medium"
          style={{
            fontSize: '13px',
            color: 'var(--color-text-success)',
            margin: 0,
          }}
        >
          Switching saves{' '}
          <span className="font-mono" style={{ fontSize: '15px' }}>
            {formatDollar(saving)}/year
          </span>{' '}
          — the full IC saving flows through automatically at 100%.
        </p>
      </div>
    </section>
  );
}
