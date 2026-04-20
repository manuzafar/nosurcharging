'use client';

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface WhereIStandTodayProps {
  outputs: AssessmentOutputs;
  pspName: string;
  volume: number;
  planType: 'flat' | 'costplus' | 'blended';
  surcharging: boolean;
}

function formatDollar(value: number): string {
  return '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

interface CostBar {
  label: string;
  value: number;
  color: string;
}

export function WhereIStandToday({ outputs, pspName, volume, planType, surcharging }: WhereIStandTodayProps) {
  const annualTotal = planType === 'costplus' ? outputs.grossCOA : outputs.annualMSF;

  const bars: CostBar[] = [
    { label: 'Interchange (IC)', value: outputs.todayInterchange, color: 'var(--color-accent)' },
    { label: 'Scheme fees', value: outputs.todayScheme, color: 'var(--color-text-tertiary)' },
    { label: 'PSP margin', value: outputs.todayMargin, color: '#4B9E7E' },
  ];

  const maxValue = Math.max(...bars.map((b) => b.value), 1);

  const category = outputs.category;
  const showSurcharge = surcharging && (category === 3 || category === 4);

  return (
    <div className="mt-4">
      <p
        className="mb-4"
        style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
      >
        What you pay {pspName} each year
      </p>

      <div className="flex flex-col gap-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div
              className="flex items-center justify-between mb-1.5"
              style={{ fontSize: '13px' }}
            >
              <span style={{ color: 'var(--color-text-secondary)' }}>{bar.label}</span>
              <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {formatDollar(bar.value)}
              </span>
            </div>
            <div
              style={{
                height: '8px',
                borderRadius: '4px',
                background: 'var(--color-bg-secondary, #F5F3EF)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: '4px',
                  background: bar.color,
                  width: `${Math.max((bar.value / maxValue) * 100, 2)}%`,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total divider */}
      <div
        style={{
          borderTop: '1px solid var(--color-border-secondary)',
          marginTop: '16px',
          paddingTop: '12px',
        }}
      >
        <div className="flex items-center justify-between" style={{ fontSize: '14px' }}>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            Annual total
          </span>
          <span className="font-mono" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {formatDollar(annualTotal)}
          </span>
        </div>
        <p
          className="mt-1"
          style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
        >
          across {formatDollar(volume)} in annual card revenue
        </p>
      </div>

      {/* Surcharge recovery — Cat 3/4 only */}
      {showSurcharge && (
        <div
          className="mt-4 rounded-lg p-4"
          style={{
            background: '#F0FAF6',
            border: '1px solid #C6E7D9',
          }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: '13px' }}>
            <span style={{ color: '#2D7A5E' }}>Surcharge recovery</span>
            <span className="font-mono" style={{ color: '#2D7A5E', fontWeight: 500 }}>
              {formatDollar(outputs.surchargeRevenue)}
            </span>
          </div>
          <div
            className="flex items-center justify-between mt-2 pt-2"
            style={{
              fontSize: '14px',
              borderTop: '1px solid #C6E7D9',
            }}
          >
            <span style={{ color: '#2D7A5E', fontWeight: 500 }}>Net position</span>
            <span className="font-mono" style={{ color: '#2D7A5E', fontWeight: 500 }}>
              {formatDollar(annualTotal - outputs.surchargeRevenue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
