'use client';

// CB-15: Escape Scenario Card — Categories 2 and 4 only.
// Shows the merchant what their position would be on cost-plus,
// removing all pass-through uncertainty. Strongest CTA driver.
//
// Left card:  current flat rate plan — octNet updates with slider
// Right card: cost-plus escape — fixed, calculated once on mount
//             with planType: 'costplus', passThrough: 1.0
//
// Range values (at 0% PT and 100% PT) calculated once on mount.

import { useMemo } from 'react';
import { PillBadge } from '@/components/ui/PillBadge';
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
  passThrough,
  originalRaw,
  resolutionContext,
  pspName,
}: EscapeScenarioCardProps) {
  // ── Cost-plus escape — calculated ONCE on mount ────────────────
  // Hooks must be called before any conditional return.
  const costPlusOctNet = useMemo(() => {
    if (category !== 2 && category !== 4) return 0;
    const costPlusResolved = resolveAssessmentInputs(
      { ...originalRaw, planType: 'costplus', passThrough: 1.0 },
      resolutionContext,
    );
    const costPlusOutputs = calculateMetrics(costPlusResolved);
    return costPlusOutputs.octNet;
  }, [originalRaw, resolutionContext, category]);

  // ── Range values — calculated ONCE on mount ────────────────────
  const { rangeMin, rangeMax } = useMemo(() => {
    if (category !== 2 && category !== 4) return { rangeMin: 0, rangeMax: 0 };
    const at0 = resolveAssessmentInputs(
      { ...originalRaw, passThrough: 0 },
      resolutionContext,
    );
    const at100 = resolveAssessmentInputs(
      { ...originalRaw, passThrough: 1.0 },
      resolutionContext,
    );
    const outputs0 = calculateMetrics(at0);
    const outputs100 = calculateMetrics(at100);
    return {
      rangeMin: outputs100.octNet,
      rangeMax: outputs0.octNet,
    };
  }, [originalRaw, resolutionContext, category]);

  // Only visible for categories 2 and 4
  if (category !== 2 && category !== 4) return null;

  const saving = Math.abs(outputs.octNet - costPlusOctNet);
  const pctLabel = Math.round(passThrough * 100);

  return (
    <div>
      <div className="grid gap-3 max-[500px]:grid-cols-1" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left card — current flat rate plan */}
        <div
          className="rounded-xl p-4"
          style={{ border: '0.5px solid var(--color-border-secondary)' }}
        >
          <PillBadge variant="amber">Your current plan</PillBadge>

          <p
            className="mt-3 font-mono font-medium"
            style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}
          >
            {formatDollar(outputs.octNet)}
          </p>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Oct 2026 net cost at {pctLabel}% pass-through
          </p>
          <p className="mt-2 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Range: {formatDollar(rangeMin)}–{formatDollar(rangeMax)} depending on {pspName}
          </p>
        </div>

        {/* Right card — cost-plus escape (featured, 1.5px green border) */}
        <div
          className="rounded-xl p-4"
          style={{ border: '1.5px solid var(--color-border-success)' }}
        >
          <PillBadge variant="green">Escape scenario</PillBadge>

          <p
            className="mt-3 font-mono font-medium"
            style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}
          >
            {formatDollar(costPlusOctNet)}
          </p>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            IC saving flows 100% automatically. No pass-through risk.
          </p>
          <p
            className="mt-2 font-mono text-caption font-medium"
            style={{ color: 'var(--color-text-success)' }}
          >
            Saves {formatDollar(saving)}/year vs your current plan at {pctLabel}% pass-through
          </p>
        </div>
      </div>

      {/* Note below cards */}
      <p
        className="mt-3 text-caption"
        style={{ color: 'var(--color-text-tertiary)', lineHeight: '1.55' }}
      >
        Switching to cost-plus requires renegotiating with {pspName} or switching providers.
        The discovery call will confirm whether this is achievable for your volume and {pspName}.
      </p>
    </div>
  );
}
