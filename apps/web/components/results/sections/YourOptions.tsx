'use client';

import { useState } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface YourOptionsProps {
  category: 1 | 2 | 3 | 4;
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
  recommended?: boolean;
}

const SCENARIOS: ScenarioConfig[] = [
  { label: 'Do nothing', pct: 0, borderColor: 'var(--color-text-danger, #C53030)', bgColor: '#FEF2F2' },
  { label: 'Reprice 1.0%', pct: 1.0, borderColor: 'var(--color-accent)', bgColor: '#FFF8F0' },
  { label: 'Reprice 1.5%', pct: 1.5, borderColor: '#4B9E7E', bgColor: '#F0FAF6', recommended: true },
];

export function YourOptions({ category, outputs, passThrough, volume, surcharging, pspName }: YourOptionsProps) {
  const [sliderPct, setSliderPct] = useState(1.5);

  // Cat 1/2: not applicable
  if (category === 1 || category === 2) return null;

  const calcNet = (pct: number) => {
    const newRev = volume * pct / 100;
    return newRev - outputs.surchargeRevenue + (outputs.icSaving * passThrough);
  };

  return (
    <div className="mt-4">
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
        Compare repricing scenarios to offset the surcharge ban impact.
      </p>

      {/* Scenario cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {SCENARIOS.map((s) => {
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
                {s.recommended && (
                  <span
                    className="rounded-pill"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: '#4B9E7E',
                      color: '#FFFFFF',
                    }}
                  >
                    Recommended
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
            {sliderPct.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.1}
          value={sliderPct}
          onChange={(e) => setSliderPct(parseFloat(e.target.value))}
          className="w-full accent-amber-600"
          aria-label="Custom repricing percentage"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>0%</span>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>3%</span>
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-secondary)' }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Net position at {sliderPct.toFixed(1)}%
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
    </div>
  );
}
