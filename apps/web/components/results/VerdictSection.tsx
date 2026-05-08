'use client';

// Results summary strip — the first thing the merchant sees.
//
// Layout (per Results_V2 redesign):
//   Desktop md+: 2-column grid. Left = situation pill + estimated label,
//                verdict heading, body copy. Right = "Net annual impact"
//                label, P&L centre estimate (44px mono), "per year" sub,
//                daily-cost pill, optional range pill.
//   Mobile <md:  Single column. P&L 38px. Daily pill below P&L. Range pill
//                below daily.
//
// Body copy is the conditional, non-prescriptive text shipped in PR #36
// (no "reprice to absorb" / "act on both fronts" language).
//
// Banned phrasing: never "your PSP" or "your provider" — always inline psp.

import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface VerdictSectionProps {
  outputs: AssessmentOutputs;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
}

// Situation pill variants — 4px corner radius (compact tag, not pill).
// Colour pair scheme: light bg + saturated text for legibility against
// the white strip.
export const SITUATION_PILLS: Record<
  1 | 2 | 3 | 4 | 5,
  { background: string; color: string }
> = {
  1: {
    background: 'var(--color-background-success)',
    color: 'var(--color-text-success)',
  },
  2: {
    background: 'var(--color-background-warning)',
    color: 'var(--color-text-warning)',
  },
  3: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
  4: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
  5: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
};

function formatDollar(value: number): string {
  return '$' + Math.round(Math.abs(value)).toLocaleString('en-AU');
}

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  return (value > 0 ? '+' : '−') + '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
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

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function buildContextLine(
  volume: number,
  pspName: string,
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost',
  msfRate: number,
  surcharging: boolean,
  surchargeRate: number,
): string {
  const parts: string[] = [`${formatVolumeShort(volume)} annual card revenue`];

  if (planType === 'zero_cost') {
    parts.push(`${pspName} zero-cost EFTPOS`);
    return parts.join(' · ');
  }

  if (planType === 'flat') {
    parts.push(`${pspName} flat rate ${formatPct(msfRate)}`);
  } else if (planType === 'blended') {
    parts.push(`${pspName} blended rate`);
  } else {
    parts.push(`${pspName} cost-plus`);
  }

  if (surcharging) {
    parts.push(`surcharging ${formatPct(surchargeRate)}`);
  }

  return parts.join(' · ');
}

function getCategoryBody(category: 1 | 2 | 3 | 4 | 5, psp: string): string {
  const bodies: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: `Your cost-plus plan means interchange savings flow to you automatically on 1 October. No action is needed to capture the saving — it will appear on your next ${psp} statement after the reform date. You should still verify this with ${psp} in writing before October.`,
    2: `The interchange saving exists, but whether you see it depends on ${psp}. On a flat rate, ${psp} could absorb the full saving and keep your rate unchanged. You need to ask them directly — and get it in writing — whether they will pass through the saving.`,
    3: `Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October. The interchange saving on your cost-plus plan offsets only a fraction of that lost revenue. How you respond — through pricing, absorbing the cost from margin, or optimising your payment setup — depends on your gross margin and competitive position. Your action plan below works through the options in the right order.`,
    4: `You face two challenges simultaneously: your surcharge revenue disappears, and your flat rate may not pass the interchange saving through to you. Before deciding how to respond, confirm with ${psp} what your actual rate will look like after October — the answer changes your real exposure. Your action plan below works through both challenges in the right order.`,
    5: `You currently pay $0 for card acceptance — your customers cover it through the surcharge ${psp} adds at the terminal. From 1 October, that surcharge cannot apply to Visa, Mastercard, or eftpos. ${psp} will move you to a standard flat-rate plan, and you'll pay for card acceptance from your own margin for the first time. Get the post-October rate from ${psp} in writing this week.`,
  };
  return bodies[category];
}

export function VerdictSection({
  outputs,
  volume,
  pspName,
  planType,
  msfRate,
  surcharging,
  surchargeRate,
}: VerdictSectionProps) {
  const { category, plSwing, plSwingLow, plSwingHigh, rangeDriver } = outputs;
  const isPositiveOrZero = plSwing >= 0;
  const pillStyle = SITUATION_PILLS[category];

  const contextLine = buildContextLine(
    volume,
    pspName,
    planType,
    msfRate,
    surcharging,
    surchargeRate,
  );

  // Daily anchor — Math.round(Math.abs(plSwing) / 365). Suppressed for
  // exactly-zero plSwing (Cat 2 at 0% pass-through) — "$0 more per day"
  // reads as nonsensical context.
  const dailyAnchor = Math.round(Math.abs(plSwing) / 365);
  const showDailyPill = dailyAnchor > 0;
  const dailyTail = isPositiveOrZero ? 'in your pocket' : 'in net payments cost';

  // P&L hero number colour: red for net negative, em (green) for net positive.
  // This is the centre estimate (plSwing), not the range bound.
  const pnlColor = plSwing < 0
    ? 'var(--color-text-danger)'
    : plSwing > 0
      ? 'var(--color-text-success)'
      : 'var(--color-text-secondary)';

  // Daily pill colours follow the same sign convention.
  const dailyBg = plSwing < 0
    ? 'var(--color-background-danger)'
    : plSwing > 0
      ? 'var(--color-background-success)'
      : 'var(--color-background-secondary)';
  const dailyText = plSwing < 0
    ? 'var(--color-text-danger)'
    : plSwing > 0
      ? 'var(--color-text-success)'
      : 'var(--color-text-secondary)';

  // Legacy fallback: pre-range DB rows lack plSwingLow. Render a single hero
  // number on the right with no daily pill and a "Complete a new assessment"
  // note below.
  const isLegacy = plSwingLow === undefined;

  return (
    <section
      className="bg-white"
      style={{ borderBottom: '0.5px solid var(--color-border-secondary)' }}
    >
      <div className="px-4 py-4 md:px-7 md:py-5">
        <div className="md:grid md:grid-cols-[1fr_auto] md:gap-6 md:items-start">
          {/* ── LEFT COLUMN ─────────────────────────────────────── */}
          <div className="md:max-w-[500px]">
            {/* Eyebrow row */}
            <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
              <span
                className="font-bold uppercase"
                style={{
                  ...pillStyle,
                  fontSize: '8.5px',
                  letterSpacing: '0.5px',
                  padding: '3px 9px',
                  borderRadius: '4px',
                }}
              >
                Situation {category}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Estimated · market averages
              </span>
            </div>

            {/* Verdict heading */}
            <h2
              className="font-serif font-bold"
              style={{
                fontSize: '17px',
                lineHeight: 1.35,
                color: 'var(--color-text-primary)',
                marginBottom: '8px',
              }}
            >
              {CATEGORY_VERDICTS[category]}
            </h2>

            {/* Body copy */}
            <p
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}
            >
              {getCategoryBody(category, pspName)}
            </p>
          </div>

          {/* ── RIGHT COLUMN ────────────────────────────────────── */}
          <div className="mt-5 md:mt-0 md:text-right md:min-w-[240px]">
            <p
              className="uppercase"
              style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: 'var(--color-text-tertiary)',
                marginBottom: '4px',
              }}
            >
              Net annual impact
            </p>

            <p
              className="font-mono font-bold leading-none"
              style={{
                fontSize: 'clamp(38px, 7vw, 44px)',
                color: pnlColor,
                letterSpacing: '-1.5px',
              }}
            >
              {formatSignedDollar(plSwing)}
            </p>

            <p
              style={{
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
                marginTop: '3px',
              }}
            >
              per year from 1 October 2026
            </p>

            {/* Range descriptor — compressed from the previous "Expected"
                line. Tells the merchant which assumption produced the
                centre estimate (pass-through %, market rate, or card mix
                accuracy). */}
            {!isLegacy && (
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                {rangeDriver === 'pass_through'
                  ? '— at 45% PSP pass-through (centre)'
                  : rangeDriver === 'post_reform_rate'
                    ? '— at 1.4% market estimate (centre)'
                    : '— at estimated card mix (centre)'}
              </p>
            )}

            {/* Pills column — stacked vertically, right-aligned on desktop.
                Without this flex wrapper the two inline-flex pills would sit
                on the same horizontal line because text-align:right puts
                multiple inline elements end-to-end (not stacked). */}
            {(showDailyPill || (!isLegacy && plSwingLow !== plSwingHigh)) && (
              <div className="flex flex-col gap-2 md:items-end" style={{ marginTop: '10px' }}>
                {/* Daily-cost pill */}
                {showDailyPill && (
                  <span
                    className="inline-flex items-baseline"
                    style={{
                      background: dailyBg,
                      borderRadius: '6px',
                      padding: '7px 12px',
                      color: dailyText,
                    }}
                  >
                    <span className="font-mono font-bold" style={{ fontSize: '18px' }}>
                      ${dailyAnchor.toLocaleString('en-AU')}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.75, marginLeft: '6px' }}>
                      {' '}more per day {dailyTail}
                    </span>
                  </span>
                )}

                {/* Range pill — suppressed when low === high to avoid noise */}
                {!isLegacy && plSwingLow !== plSwingHigh && (
                  <span
                    className="inline-flex items-center gap-2"
                    style={{
                      border: '0.5px solid var(--color-border-secondary)',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      background: 'var(--color-background-primary)',
                    }}
                  >
                    <span
                      className="uppercase"
                      style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      Range
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {formatSignedDollar(plSwingLow)} to {formatSignedDollar(plSwingHigh)}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Legacy fallback note — only when plSwingLow is undefined */}
            {isLegacy && (
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '8px',
                }}
              >
                Complete a new assessment to see the full range.
              </p>
            )}
          </div>
        </div>

        {/* Context line — full-width below the grid */}
        <p
          style={{
            marginTop: '14px',
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {contextLine}
        </p>
      </div>
    </section>
  );
}
