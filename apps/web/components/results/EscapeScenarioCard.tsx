'use client';

// EscapeScenarioCard — per ux-spec §3.7 + RESULTS_CONTENT_CREDIBILITY_BRIEF
// (May 2026). Categories 2 and 4 only.
//
// Four variants based on the PSP's offersItemisedPlan capability flag:
//   - 'yes'                         → existing green comparison card
//   - 'volume_gated' + above floor  → existing green comparison card
//   - 'volume_gated' + below floor  → disclosed-threshold variant
//   - 'no'                          → "consider switching" variant
//   - 'gateway_only'                → "ask which acquirer" variant
//
// The brief's locked copy strings appear verbatim — PSP name + dollar
// figures are interpolated only.
//
// Banned: "no negotiation needed" / "your PSP" / "your provider".
// Use: "flows through automatically" / explicit pspName.

import { useMemo } from 'react';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import { PSP_PUBLISHED_RATES } from '@nosurcharging/calculations/constants/psp-rates';
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
  // Cost-plus escape — calculated ONCE on mount, used only by the
  // 'yes' / 'volume_gated (above)' variants.
  const costPlusOctNet = useMemo(() => {
    if (category !== 2 && category !== 4) return 0;
    const costPlusResolved = resolveAssessmentInputs(
      { ...originalRaw, planType: 'costplus', passThrough: 1.0 },
      resolutionContext,
    );
    return calculateMetrics(costPlusResolved).octNet;
  }, [originalRaw, resolutionContext, category]);

  if (category !== 2 && category !== 4) return null;

  const caps = PSP_PUBLISHED_RATES[pspName];

  // Defensive default — an unknown PSP key would otherwise blank the
  // section. Fall back to the standard comparison card; the wholesale
  // saving math is still valid.
  if (!caps) {
    return (
      <ItemisedComparison
        pspName={pspName}
        currentOctNet={outputs.octNet}
        itemisedOctNet={costPlusOctNet}
        saving={Math.abs(outputs.octNet - costPlusOctNet)}
      />
    );
  }

  const annualVolume = originalRaw.volume ?? 0;
  const thresholdAnnual =
    caps.itemisedVolumeThresholdMonthly !== undefined
      ? caps.itemisedVolumeThresholdMonthly * 12
      : null;

  switch (caps.offersItemisedPlan) {
    case 'yes':
      return (
        <ItemisedComparison
          pspName={pspName}
          currentOctNet={outputs.octNet}
          itemisedOctNet={costPlusOctNet}
          saving={Math.abs(outputs.octNet - costPlusOctNet)}
        />
      );

    case 'volume_gated': {
      const qualifies = thresholdAnnual !== null && annualVolume >= thresholdAnnual;
      if (qualifies) {
        return (
          <ItemisedComparison
            pspName={pspName}
            currentOctNet={outputs.octNet}
            itemisedOctNet={costPlusOctNet}
            saving={Math.abs(outputs.octNet - costPlusOctNet)}
          />
        );
      }
      return (
        <VolumeGatedVariant
          pspName={pspName}
          thresholdAnnual={thresholdAnnual}
          potentialSaving={Math.abs(outputs.octNet - costPlusOctNet)}
        />
      );
    }

    case 'no':
      return <NoItemisedVariant pspName={pspName} />;

    case 'gateway_only':
      return <GatewayOnlyVariant pspName={pspName} />;
  }
}

// ── Variant: standard green comparison card (yes / volume_gated above) ─

function ItemisedComparison({
  pspName,
  currentOctNet,
  itemisedOctNet,
  saving,
}: {
  pspName: string;
  currentOctNet: number;
  itemisedOctNet: number;
  saving: number;
}) {
  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
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
          style={{ gap: '16px', marginBottom: '16px' }}
        >
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
              {formatDollar(currentOctNet)}/yr
            </p>
          </div>

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
              {formatDollar(itemisedOctNet)}/yr
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

// ── Variant: volume_gated below threshold ─────────────────────────────

function VolumeGatedVariant({
  pspName,
  thresholdAnnual,
  potentialSaving,
}: {
  pspName: string;
  thresholdAnnual: number | null;
  potentialSaving: number;
}) {
  const thresholdLabel = thresholdAnnual
    ? `around $${Math.round(thresholdAnnual / 1000).toLocaleString('en-AU')}K+ in annual international card volume`
    : 'custom enterprise volumes';
  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {pspName} also offers an itemised (interchange-plus) plan at custom
        volumes — typically {thresholdLabel}. If your business is at or near
        this scale, switching can save up to{' '}
        <strong className="font-mono" style={{ fontWeight: 500 }}>
          {formatDollar(potentialSaving)}/year
        </strong>{' '}
        because the interchange saving flows through automatically.
      </p>
    </section>
  );
}

// ── Variant: 'no' (Square, Zeller) ────────────────────────────────────

function NoItemisedVariant({ pspName }: { pspName: string }) {
  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {pspName} does not offer an itemised (interchange-plus) plan. Your
        alternative options are: (a) negotiating a lower flat rate as October
        data emerges, or (b) considering a switch to a provider that offers
        cost-plus pricing — Adyen, Tyro at $20K+/month, or any of the big
        four banks above their tier thresholds.
      </p>
    </section>
  );
}

// ── Variant: 'gateway_only' (eWAY) ────────────────────────────────────

function GatewayOnlyVariant({ pspName }: { pspName: string }) {
  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      <p
        style={{
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {pspName} is a payment gateway. Itemised pricing depends on your
        underlying acquirer (the bank or processor settling your funds). Ask
        {' '}{pspName} which acquirer is on your account, then engage that
        provider directly about cost-plus pricing.
      </p>
    </section>
  );
}
