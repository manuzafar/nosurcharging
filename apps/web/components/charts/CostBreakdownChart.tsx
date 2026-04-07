'use client';

// CB-09: Stacked bar chart — secondary visual.
// Lives inside AssumptionsPanel only.
// Two columns: Today and October 2026.
//
// Today column total:
//   Cost-plus: grossCOA (debitIC + creditIC + schemeFees + pspMargin)
//   Flat rate: annualMSF
//
// October column total:
//   Cost-plus: grossCOA - totalICSaving
//   Flat rate: annualMSF - (totalICSaving × passThrough)
//
// CRITICAL INVARIANT: scheme fees bar exactly equal height in both columns.

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface CostBreakdownChartProps {
  outputs: AssessmentOutputs;
  passThrough: number;
}

const CHART_COLOURS = {
  interchange: '#E24B4A',
  scheme: '#1A6B5A',
  margin: '#888780',
  surcharge: '#3B6D11',
} as const;

export function CostBreakdownChart({ outputs, passThrough }: CostBreakdownChartProps) {
  // ── Scheme fees invariant ──────────────────────────────────────
  const schemeRounded = Math.round(outputs.todayScheme * 100) / 100;
  const schemeOctRounded = Math.round(outputs.oct2026Scheme * 100) / 100;
  if (schemeRounded !== schemeOctRounded) {
    throw new Error(
      `Scheme fees invariant violated: todayScheme=${schemeRounded} !== oct2026Scheme=${schemeOctRounded}`,
    );
  }

  // ── Today column segments ──────────────────────────────────────
  const todayInterchange = Math.round(outputs.todayInterchange);
  const todayScheme = Math.round(schemeRounded);
  const todayMargin = Math.round(outputs.todayMargin);
  const todaySurchargeOffset = outputs.surchargeRevenue > 0
    ? -Math.round(outputs.surchargeRevenue)
    : 0;

  // ── October column segments ────────────────────────────────────
  // IC saving reduces the interchange portion
  const isFlatRate = outputs.category === 2 || outputs.category === 4;
  const effectiveICSaving = isFlatRate
    ? Math.round(outputs.icSaving * passThrough)
    : Math.round(outputs.icSaving);

  const octInterchange = Math.max(0, todayInterchange - effectiveICSaving);
  const octScheme = todayScheme; // INVARIANT: identical
  const octMargin = todayMargin; // unchanged by reform

  const data = [
    {
      name: 'Today',
      interchange: todayInterchange,
      scheme: todayScheme,
      margin: todayMargin,
      surcharge: todaySurchargeOffset,
    },
    {
      name: 'Oct 2026',
      interchange: octInterchange,
      scheme: octScheme,
      margin: octMargin,
      surcharge: 0, // surcharge gone after reform
    },
  ];

  const formatDollar = (v: number) =>
    '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');

  return (
    <div className="mt-4">
      <p
        className="text-caption font-medium mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Cost composition
      </p>

      {/* Custom HTML legend */}
      <div className="flex flex-wrap gap-3.5 mb-3">
        {[
          { colour: CHART_COLOURS.interchange, label: 'Interchange' },
          { colour: CHART_COLOURS.scheme, label: 'Scheme fees' },
          { colour: CHART_COLOURS.margin, label: 'Margin' },
          { colour: CHART_COLOURS.surcharge, label: 'Surcharge offset' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ background: item.colour }}
            />
            <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => '$' + (v / 1000).toFixed(0) + 'K'}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatDollar(value as number),
                name.charAt(0).toUpperCase() + name.slice(1),
              ]}
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
            <Bar
              dataKey="interchange"
              stackId="cost"
              fill={CHART_COLOURS.interchange}
              isAnimationActive={false}
            />
            <Bar
              dataKey="scheme"
              stackId="cost"
              fill={CHART_COLOURS.scheme}
              isAnimationActive={false}
            />
            <Bar
              dataKey="margin"
              stackId="cost"
              fill={CHART_COLOURS.margin}
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="surcharge"
              stackId="cost"
              fill={CHART_COLOURS.surcharge}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
