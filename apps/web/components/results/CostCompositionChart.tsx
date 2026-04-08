'use client';

// CostCompositionChart — per ux-spec §3.8.
// Lives in the depth zone, between EscapeScenarioCard and AssumptionsPanel.
// Two horizontal stacked bars (Today / October) with four segments:
//   1. Interchange     #7F1D1D (the only segment that changes Oct 1)
//   2. Scheme fees     #DDD5C8 (unchanged — RBA reform doesn't touch them)
//   3. [PSP] margin    #9A8C78 (unchanged)
//   4. Other (flat rate bundle) #F3EDE4 (HIDDEN for cost-plus)
//
// CRITICAL INVARIANT (CLAUDE.md Rule 5): scheme fees segment has the
// EXACT same height in both columns. We round both values and throw
// if they differ — same defensive check the old CostBreakdownChart had.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface CostCompositionChartProps {
  outputs: AssessmentOutputs;
  passThrough: number;
  pspName: string;
}

const COLOURS = {
  interchange: '#7F1D1D',
  scheme: '#DDD5C8',
  margin: '#9A8C78',
  other: '#F3EDE4',
} as const;

export function CostCompositionChart({
  outputs,
  passThrough,
  pspName,
}: CostCompositionChartProps) {
  // ── Scheme fees invariant ──────────────────────────────────────
  const schemeRounded = Math.round(outputs.todayScheme);
  const schemeOctRounded = Math.round(outputs.oct2026Scheme);
  if (schemeRounded !== schemeOctRounded) {
    throw new Error(
      `Scheme fees invariant violated: todayScheme=${schemeRounded} !== oct2026Scheme=${schemeOctRounded}`,
    );
  }

  const isFlatRate = outputs.category === 2 || outputs.category === 4;

  // ── Today column segments ──────────────────────────────────────
  const todayInterchange = Math.round(outputs.todayInterchange);
  const todayScheme = schemeRounded;
  const todayMargin = Math.round(outputs.todayMargin);

  // For flat rate: "Other" is the residual bundled markup beyond the
  // wholesale cost stack — annualMSF − (interchange + scheme + margin).
  // For cost-plus: no "Other" segment, the bill IS the wholesale stack.
  const todayOther = isFlatRate
    ? Math.max(0, Math.round(outputs.annualMSF) - todayInterchange - todayScheme - todayMargin)
    : 0;

  // ── October column segments ────────────────────────────────────
  // For cost-plus: full IC saving applies. For flat rate: only the
  // pass-through fraction reaches the merchant (rest stays with PSP).
  const effectiveICSaving = isFlatRate
    ? Math.round(outputs.icSaving * passThrough)
    : Math.round(outputs.icSaving);

  const octInterchange = Math.max(0, todayInterchange - effectiveICSaving);
  const octScheme = todayScheme; // INVARIANT: identical
  const octMargin = todayMargin; // unchanged by reform
  const octOther = todayOther;   // unchanged by reform (flat rate only)

  const data = [
    {
      name: 'Today',
      interchange: todayInterchange,
      scheme: todayScheme,
      margin: todayMargin,
      other: todayOther,
    },
    {
      name: 'October',
      interchange: octInterchange,
      scheme: octScheme,
      margin: octMargin,
      other: octOther,
    },
  ];

  // ── Insight note copy ──────────────────────────────────────────
  const interchangeBaseline = isFlatRate
    ? Math.round(outputs.annualMSF)
    : Math.round(outputs.grossCOA);
  const interchangePct =
    interchangeBaseline > 0
      ? Math.round((todayInterchange / interchangeBaseline) * 100)
      : 0;

  const insightCopy = isFlatRate
    ? `This breakdown is estimated — your ${pspName} flat rate bundles all costs into one percentage. Interchange makes up approximately ${interchangePct}% of the total. Scheme fees and ${pspName}'s margin are not regulated by the reform.`
    : `Interchange is ${interchangePct}% of your ${pspName} bill. The RBA reform only cuts interchange. Scheme fees and ${pspName}'s margin are unchanged.`;

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
        What makes up your {pspName} bill
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
        Only interchange changes in October. Scheme fees and {pspName}&apos;s
        margin are unchanged by the reform.
      </p>

      {/* "Estimated breakdown" pill — flat rate only */}
      {isFlatRate && (
        <div style={{ marginBottom: '8px' }}>
          <span
            className="font-medium uppercase inline-block"
            style={{
              fontSize: '9px',
              letterSpacing: '0.8px',
              padding: '2px 7px',
              background: 'rgba(154, 140, 120, 0.1)',
              color: '#9A8C78',
            }}
          >
            Estimated breakdown
          </span>
        </div>
      )}

      {/* Custom HTML legend */}
      <div className="flex flex-wrap" style={{ gap: '12px', marginBottom: '8px' }}>
        {[
          { colour: COLOURS.interchange, label: 'Interchange (changes Oct)' },
          { colour: COLOURS.scheme, label: 'Scheme fees (unchanged)' },
          { colour: COLOURS.margin, label: `${pspName} margin (unchanged)` },
          ...(isFlatRate
            ? [{ colour: COLOURS.other, label: 'Other (flat rate bundle)' }]
            : []),
        ].map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center"
            style={{ gap: '6px' }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                background: item.colour,
                border: item.colour === COLOURS.other ? '1px solid #DDD5C8' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Chart — horizontal stacked bars */}
      <div style={{ height: 110, width: '100%' }} data-testid="cost-composition-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => '$' + (v / 1000).toFixed(0) + 'K'}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                '$' + Math.round(value).toLocaleString('en-AU'),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
              contentStyle={{
                fontSize: 11,
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
            <Bar
              dataKey="interchange"
              stackId="cost"
              fill={COLOURS.interchange}
              isAnimationActive={false}
            />
            <Bar
              dataKey="scheme"
              stackId="cost"
              fill={COLOURS.scheme}
              isAnimationActive={false}
            />
            <Bar
              dataKey="margin"
              stackId="cost"
              fill={COLOURS.margin}
              isAnimationActive={false}
            />
            {isFlatRate && (
              <Bar
                dataKey="other"
                stackId="cost"
                fill={COLOURS.other}
                isAnimationActive={false}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight note */}
      <div
        style={{
          background: '#FEF3E0',
          borderLeft: '2px solid #BA7517',
          padding: '10px 12px',
          marginTop: '12px',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: '#633806',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {insightCopy}
        </p>
      </div>
    </section>
  );
}
