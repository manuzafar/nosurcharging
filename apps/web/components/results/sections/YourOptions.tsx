'use client';

import { useState } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface YourOptionsProps {
  category: 1 | 2 | 3 | 4 | 5;
  outputs: AssessmentOutputs;
  passThrough: number;
  volume: number;
  surcharging: boolean;
  pspName: string;
}

function formatDollar(value: number): string {
  return '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  const prefix = value > 0 ? '+' : '−';
  return prefix + '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

interface ScenarioConfig {
  label: string;
  pct: number;
  borderColor: string;
  bgColor: string;
  isBreakEven?: boolean;
}

// Reference scenarios for repricing comparison. The "Do nothing" card shows
// the cost of inaction; the 1.0% / 1.5% cards are reference points the
// merchant can model against. The "Recommended" badge that previously sat
// on 1.5% has been removed — 1.5% is not the break-even for most merchants
// (using surcharge rate as the recommended price increase systematically
// over-recovers). The actual break-even is computed at render time and
// rendered as a fourth, emerald-styled card and a slider tick marker.
const SCENARIOS: ScenarioConfig[] = [
  { label: 'Do nothing', pct: 0, borderColor: 'var(--color-text-danger, #C53030)', bgColor: '#FEF2F2' },
  { label: 'Reprice 1.0%', pct: 1.0, borderColor: 'var(--color-accent)', bgColor: '#FFF8F0' },
  { label: 'Reprice 1.5%', pct: 1.5, borderColor: '#4B9E7E', bgColor: '#F0FAF6' },
];

export function YourOptions({ category, outputs, passThrough, volume, surcharging, pspName }: YourOptionsProps) {
  // Compute break-even: the price increase that exactly offsets the
  // post-reform shortfall. abs(plSwing) / volume × 100. Rendered to 2dp
  // because 1dp rounding biases towards over-recovery.
  const breakEvenPct =
    volume > 0 ? (Math.abs(outputs.plSwing) / volume) * 100 : 0;
  const breakEvenLabel = breakEvenPct.toFixed(2);

  const [sliderPct, setSliderPct] = useState(breakEvenPct);

  // Cat 1/2: not applicable
  if (category === 1 || category === 2) return null;

  const calcNet = (pct: number) => {
    const newRev = volume * pct / 100;
    return newRev - outputs.surchargeRevenue + (outputs.icSaving * passThrough);
  };

  // Append break-even card at the end so the merchant sees the reference
  // points (1%, 1.5%) and then the factual break-even alongside.
  const scenariosWithBreakEven: ScenarioConfig[] = [
    ...SCENARIOS,
    {
      label: `Break-even (${breakEvenLabel}%)`,
      pct: breakEvenPct,
      borderColor: '#1A6B5A',
      bgColor: '#EBF6F3',
      isBreakEven: true,
    },
  ];

  return (
    <div className="mt-4">
      <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '4px' }}>
        If you choose to reprice — how much to change.
      </p>
      <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '16px', lineHeight: 1.55 }}>
        Repricing is one of three ways to respond to this shortfall. See your action plan for the full set of options.
      </p>

      {/* Scenario cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {scenariosWithBreakEven.map((s) => {
          const net = calcNet(s.pct);
          const daily = Math.round(net / 365);
          return (
            <div
              key={s.label}
              className="rounded-lg p-4"
              style={{
                background: s.bgColor,
                borderLeft: `3px solid ${s.borderColor}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {s.label}
                </p>
                {s.isBreakEven && (
                  <span
                    className="rounded-pill"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: '#1A6B5A',
                      color: '#FFFFFF',
                    }}
                  >
                    Break-even
                  </span>
                )}
              </div>
              <p className="font-mono" style={{ fontSize: '20px', color: net >= 0 ? '#4B9E7E' : 'var(--color-text-danger, #C53030)', fontWeight: 500 }}>
                {formatSignedDollar(net)}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                net annual position
              </p>
              <p className="font-mono" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {formatSignedDollar(daily)}/day
              </p>
            </div>
          );
        })}
      </div>

      {/* Custom slider */}
      <div
        className="mt-5 rounded-lg p-4"
        style={{
          background: 'var(--color-bg-secondary, #F5F3EF)',
          border: '1px solid var(--color-border-secondary)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Custom repricing
          </p>
          <span className="font-mono" style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {sliderPct.toFixed(2)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.01}
          value={sliderPct}
          onChange={(e) => setSliderPct(parseFloat(e.target.value))}
          className="w-full accent-amber-600"
          aria-label="Custom repricing percentage"
        />
        {/* Tick row — 0%, break-even marker (emerald), 3%. Marker positioned
            proportionally to its percentage on the 0-3% range. Pure visual
            cue; the slider remains free-form. */}
        <div className="relative mt-2" style={{ height: '14px' }}>
          <span
            className="font-mono absolute left-0"
            style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
          >
            0%
          </span>
          {breakEvenPct > 0 && breakEvenPct <= 3 && (
            <span
              className="font-mono absolute"
              style={{
                fontSize: '11px',
                color: '#1A6B5A',
                fontWeight: 500,
                left: `${(breakEvenPct / 3) * 100}%`,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
              data-testid="break-even-marker"
            >
              ▲ Break-even {breakEvenLabel}%
            </span>
          )}
          <span
            className="font-mono absolute right-0"
            style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}
          >
            3%
          </span>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-secondary)' }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Net position at {sliderPct.toFixed(2)}%
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '16px',
                fontWeight: 500,
                color: calcNet(sliderPct) >= 0 ? '#4B9E7E' : 'var(--color-text-danger, #C53030)',
              }}
            >
              {formatSignedDollar(calcNet(sliderPct))}
            </span>
          </div>
        </div>
      </div>

      {/* Absorption note — acknowledges that pricing is one of several
          paths. Sits below the slider so it reads as context, not as a
          competing CTA. */}
      <p
        className="mt-3"
        style={{
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          fontStyle: 'italic',
          lineHeight: 1.55,
        }}
      >
        If your gross margin is above 25%, absorbing this cost from margin may be viable without any price change.
      </p>
    </div>
  );
}
