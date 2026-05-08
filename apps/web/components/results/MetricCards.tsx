'use client';

// Metric cards — three category modes.
//
// Cat 3 + Cat 4 (surcharging): proportional bars showing relationship
//   between numbers. Surcharge revenue is the 100% baseline; interchange
//   saving and net gap render bars sized as a fraction of that baseline,
//   so the merchant can see at a glance how little of the loss the IC
//   saving offsets.
//
// Cat 1 + Cat 2 (no surcharging): four flat cards in a 2x2 grid — the
//   existing layout. No relationship to draw between IC saving / net P&L
//   / cost today, so a proportional visualisation isn't useful.
//
// Cat 5 (zero_cost): four custom cards centred on the post-reform
//   transition (Cost today $0 / Annual cost from October / Estimated
//   card rate / Card volume). Unchanged from the existing zero-cost
//   layout — proportional bars don't apply when one card is $0.
//
// icSaving is hidden as a separate card for Cat 5 (the saving is kept
// by the PSP during the plan transition, not the merchant — showing it
// alongside a negative plSwing creates false-positive framing). It is
// still computed in outputs and rendered in AssumptionsPanel for
// transparency.

import { useEffect, useState } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface MetricCardsProps {
  outputs: AssessmentOutputs;
  planType?: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  // Cat 5 only — sourced from the assessment inputs by the parent.
  volume?: number;
  // Cat 5 only — "Your input" | "Market estimate" — read from resolutionTrace by parent.
  estimatedMSFRateLabel?: string;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function formatSignedDollar(v: number): string {
  if (v === 0) return '$0';
  return (v > 0 ? '+' : '−') + formatDollar(v);
}

function formatVolumeShort(volume: number): string {
  if (volume >= 1_000_000) {
    const m = volume / 1_000_000;
    const formatted = m >= 10 ? m.toFixed(0) : m.toFixed(1);
    return `$${formatted}M`;
  }
  if (volume >= 1_000) {
    return `$${Math.round(volume / 1_000)}K`;
  }
  return formatDollar(volume);
}

function formatPct(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

// ── Proportional layout (Cat 3 / Cat 4) ─────────────────────────────────

interface PropCardProps {
  label: string;
  value: string;
  note: string;
  // Bar fill width (0-100). Caller computes the proportion.
  pctFill: number;
  fillColor: 'red' | 'em' | 'amber';
  // Label rendered below the bar (e.g. "100% of exposure", "5.6% offset").
  propLabel: string;
  // Top-right icon mark (single character or symbol).
  iconMark: string;
  iconBg: string; // CSS bg colour
  valueColour: string;
  // Highlight variant — used by the "Net gap to close" card to draw
  // attention via tinted bg + softer border.
  highlight?: boolean;
}

function PropCard({
  label,
  value,
  note,
  pctFill,
  fillColor,
  propLabel,
  iconMark,
  iconBg,
  valueColour,
  highlight = false,
}: PropCardProps) {
  // Animate the bar fill from 0 to pctFill on mount. 200ms delay matches
  // the prototype — gives the page a chance to settle before motion.
  const [animatedWidth, setAnimatedWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedWidth(pctFill), 200);
    return () => clearTimeout(t);
  }, [pctFill]);

  const fillBg =
    fillColor === 'red'
      ? 'var(--color-text-danger)'
      : fillColor === 'em'
        ? 'var(--color-text-success)'
        : 'var(--color-text-warning)';

  return (
    <div
      style={{
        background: highlight ? 'var(--color-background-danger)' : 'var(--color-background-primary)',
        border: highlight
          ? '0.5px solid rgba(197, 48, 48, 0.2)'
          : '0.5px solid var(--color-border-secondary)',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 1px 3px rgba(26,20,9,.06), 0 4px 16px rgba(26,20,9,.04)',
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: '10px' }}>
        <p
          className="uppercase"
          style={{
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            color: 'var(--color-text-tertiary)',
            lineHeight: 1.35,
          }}
        >
          {label}
        </p>
        <span
          className="flex items-center justify-center shrink-0"
          aria-hidden
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: iconBg,
            fontSize: '12px',
          }}
        >
          {iconMark}
        </span>
      </div>

      <p
        className="font-mono font-bold"
        style={{
          fontSize: 'clamp(20px, 4.5vw, 24px)',
          color: valueColour,
          marginBottom: '6px',
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: '10px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '10px',
          lineHeight: 1.4,
        }}
      >
        {note}
      </p>

      {/* Proportion bar — animated mount-in */}
      <div
        style={{
          height: '4px',
          background: 'var(--color-border-secondary)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '6px',
        }}
        role="img"
        aria-label={`${propLabel} relative bar`}
      >
        <div
          style={{
            height: '100%',
            borderRadius: '2px',
            background: fillBg,
            width: `${animatedWidth}%`,
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          data-testid="prop-fill"
        />
      </div>
      <div
        className="flex justify-between"
        style={{
          fontSize: '9px',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <span>0</span>
        <span>{propLabel}</span>
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────

export function MetricCards({
  outputs,
  planType = 'flat',
  volume,
  estimatedMSFRateLabel,
}: MetricCardsProps) {
  const isZeroCost = outputs.category === 5 || planType === 'zero_cost';
  const isProportional =
    !isZeroCost && (outputs.category === 3 || outputs.category === 4);

  // ── Cat 5 (zero_cost) — 4-card zero-cost layout ────────────────────────
  if (isZeroCost) {
    const rate = outputs.estimatedMSFRate ?? 0.014;
    const cells: { label: string; value: string; sub: string; colour: string }[] = [
      {
        label: 'Your cost today',
        value: '$0',
        sub: 'fully covered by PSP surcharge',
        colour: 'var(--color-text-success)',
      },
      {
        label: 'Annual cost from October',
        value: formatDollar(outputs.octNet),
        sub: `estimated at ${formatPct(rate)}`,
        colour: 'var(--color-text-danger)',
      },
      {
        label: 'Estimated card rate',
        value: formatPct(rate),
        sub: estimatedMSFRateLabel ?? 'market estimate',
        colour: 'var(--color-text-secondary)',
      },
      {
        label: 'Card volume',
        value: formatVolumeShort(volume ?? 0),
        sub: 'annual card turnover',
        colour: 'var(--color-text-secondary)',
      },
    ];
    return <FlatGrid cells={cells} />;
  }

  // ── Cat 3 + Cat 4 — proportional bars ──────────────────────────────────
  if (isProportional) {
    // Surcharge revenue is the 100% baseline. If somehow zero (Cat 3/4
    // edge case where surchargeNetworks excluded everything), fall back
    // to the flat 4-card grid.
    if (outputs.surchargeRevenue <= 0) {
      return <FlatCat1To4Grid outputs={outputs} planType={planType} />;
    }

    const baseline = outputs.surchargeRevenue;
    const icPctRaw = (outputs.icSaving / baseline) * 100;
    const icPct = Math.max(0, Math.min(100, icPctRaw));
    const gapRaw = (Math.abs(outputs.plSwing) / baseline) * 100;
    const gapPct = Math.max(0, Math.min(100, gapRaw));

    const costLabel = planType === 'costplus' ? 'annual cost-plus' : 'annual flat rate';
    const costValue = planType === 'costplus' ? outputs.grossCOA : outputs.annualMSF;

    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <PropCard
            label="Surcharge revenue lost"
            value={formatDollar(outputs.surchargeRevenue)}
            note="Certain · disappears 1 October"
            pctFill={100}
            fillColor="red"
            propLabel="100% of exposure"
            iconMark="↓"
            iconBg="var(--color-background-danger)"
            valueColour="var(--color-text-danger)"
          />
          <PropCard
            label="Interchange saving"
            value={formatDollar(outputs.icSaving)}
            note={`Uncertain · depends on ${planType === 'costplus' ? 'card mix' : 'PSP'}`}
            pctFill={icPct}
            fillColor="em"
            propLabel={`${icPctRaw.toFixed(1)}% offset`}
            iconMark="↑"
            iconBg="var(--color-background-success)"
            valueColour="var(--color-text-success)"
          />
          <PropCard
            label="Net gap to close"
            value={formatDollar(Math.abs(outputs.plSwing))}
            note="At centre estimate"
            pctFill={gapPct}
            fillColor="amber"
            propLabel={`${gapRaw.toFixed(1)}% of surcharge lost`}
            iconMark="↔"
            iconBg="var(--color-background-secondary)"
            valueColour="var(--color-text-danger)"
            highlight
          />
        </div>

        {/* 4th card — full-width row, your current annual cost. Brief calls
            this out explicitly even though the prototype shows only 3 cards. */}
        <div
          className="flex items-center justify-between"
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div>
            <p
              className="uppercase"
              style={{
                fontSize: '8.5px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--color-text-tertiary)',
                marginBottom: '4px',
              }}
            >
              Your current annual cost
            </p>
            <p
              style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}
            >
              {costLabel}
            </p>
          </div>
          <p
            className="font-mono font-bold"
            style={{
              fontSize: '20px',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.5px',
            }}
          >
            {formatDollar(costValue)}
          </p>
        </div>
      </div>
    );
  }

  // ── Cat 1 + Cat 2 (no surcharging) — existing 4-card 2x2 grid ──────────
  return <FlatCat1To4Grid outputs={outputs} planType={planType} />;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function FlatCat1To4Grid({
  outputs,
  planType,
}: {
  outputs: AssessmentOutputs;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
}) {
  const hasSurcharge = outputs.surchargeRevenue > 0;
  const costLabel = planType === 'costplus' ? 'annual cost-plus' : 'annual flat rate';
  const costValue = planType === 'costplus' ? outputs.grossCOA : outputs.annualMSF;
  const cells: { label: string; value: string; sub: string; colour: string }[] = [
    {
      label: 'Interchange saving',
      value: formatDollar(outputs.icSaving),
      sub: 'debit + credit',
      colour: 'var(--color-text-success)',
    },
    {
      label: 'Net P&L impact',
      value: formatSignedDollar(outputs.plSwing),
      sub: 'annual saving/shortfall',
      colour:
        outputs.plSwing >= 0
          ? 'var(--color-text-success)'
          : 'var(--color-text-danger)',
    },
    {
      label: 'Surcharge revenue',
      value: hasSurcharge ? formatDollar(outputs.surchargeRevenue) : '—',
      sub: hasSurcharge ? 'lost from 1 Oct' : 'not applicable',
      colour: hasSurcharge
        ? 'var(--color-text-danger)'
        : 'var(--color-text-tertiary)',
    },
    {
      label: 'Your cost today',
      value: formatDollar(costValue),
      sub: costLabel,
      colour: 'var(--color-text-secondary)',
    },
  ];
  return <FlatGrid cells={cells} />;
}

function FlatGrid({
  cells,
}: {
  cells: { label: string; value: string; sub: string; colour: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-xl p-4 bg-white border border-rule"
        >
          <p
            className="uppercase"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '1.2px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {cell.label}
          </p>
          <p
            className="mt-1.5 font-mono font-medium text-financial-standard"
            style={{ color: cell.colour, fontSize: 'clamp(14px, 4.5vw, 22px)' }}
          >
            {cell.value}
          </p>
          <p
            className="mt-0.5"
            style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
          >
            {cell.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
