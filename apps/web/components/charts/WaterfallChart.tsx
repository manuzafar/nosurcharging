'use client';

// CB-16: Waterfall Chart — primary visual on results page.
// Shows WHY the P&L changes: surcharge loss vs IC saving.
// Four floating bars: Today → Surcharge lost → IC saving → October.
// Bars 3–4 update when passThrough changes (parent re-renders with new outputs).
//
// CRITICAL INVARIANT: scheme fees must be identical both periods.
// Enforced with a runtime check — throws if violated.
//
// pivotPoint is the "top" of bars 2 and 3:
//   flat rate:  outputs.annualMSF  (volume × msfRate)
//   cost-plus:  outputs.grossCOA   (debitIC + creditIC + scheme + margin)

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface WaterfallChartProps {
  outputs: AssessmentOutputs;
}

const COLOURS = {
  today: '#888780',
  surchargeLost: '#E24B4A',
  icSaving: '#3B6D11',
  worse: '#E24B4A',
  better: '#3B6D11',
} as const;

const LEGEND_ITEMS = [
  { colour: '#E24B4A', label: 'Interchange' },
  { colour: '#BA7517', label: 'Scheme fees' },
  { colour: '#888780', label: 'Margin' },
  { colour: '#3B6D11', label: 'Surcharge offset' },
];

export function WaterfallChart({ outputs }: WaterfallChartProps) {
  // ── Scheme fees invariant — enforced with code ─────────────────
  const schemeRounded = Math.round(outputs.todayScheme * 100) / 100;
  const schemeOctRounded = Math.round(outputs.oct2026Scheme * 100) / 100;
  if (schemeRounded !== schemeOctRounded) {
    throw new Error(
      `Scheme fees invariant violated: todayScheme=${schemeRounded} !== oct2026Scheme=${schemeOctRounded}`,
    );
  }

  // ── Pivot point — top of bars 2 and 3 ──────────────────────────
  // For flat rate: annualMSF (the blended fee before surcharge offset)
  // For cost-plus: grossCOA (the total cost before surcharge offset)
  const pivotPoint =
    outputs.category === 2 || outputs.category === 4
      ? outputs.annualMSF
      : outputs.grossCOA;

  const { netToday, octNet } = outputs;
  const hasSurcharge = pivotPoint > netToday + 0.01; // surcharge creates gap
  const bar4Colour = octNet > netToday ? COLOURS.worse : COLOURS.better;

  const data = [
    {
      name: 'Today',
      range: [0, Math.round(netToday)],
      colour: COLOURS.today,
    },
    {
      name: 'Surcharge lost',
      range: hasSurcharge
        ? [Math.round(netToday), Math.round(pivotPoint)]
        : [0, 0],
      colour: COLOURS.surchargeLost,
    },
    {
      name: 'IC saving',
      range: [Math.round(octNet), Math.round(pivotPoint)],
      colour: COLOURS.icSaving,
    },
    {
      name: 'October',
      range: [0, Math.round(octNet)],
      colour: bar4Colour,
    },
  ];

  const formatDollar = (v: number) =>
    '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');

  return (
    <div
      className="rounded-xl p-4"
      style={{
        border: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
      }}
    >
      <p className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
        How your payments cost changes
      </p>

      {/* Custom HTML legend */}
      <div className="mt-2 flex flex-wrap gap-3.5">
        {LEGEND_ITEMS.map((item) => (
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

      <div className="mt-3" style={{ height: 180 }}>
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
              formatter={(value: number[]) => {
                const [low, high] = value;
                return formatDollar(high! - low!);
              }}
              labelStyle={{ fontSize: 12, fontWeight: 500 }}
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: '0.5px solid var(--color-border-secondary)',
              }}
            />
            <Bar
              dataKey="range"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.colour} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
