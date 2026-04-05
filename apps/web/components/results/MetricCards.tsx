'use client';

// Three cells in ONE container divided by 0.5px borders.
// NOT three separate card components.
// Labels: 10px, letter-spacing 1px. Values: 20px mono weight 500.
// IC Saving value in --color-text-success.

import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface MetricCardsProps {
  outputs: AssessmentOutputs;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(v).toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function MetricCards({ outputs }: MetricCardsProps) {
  const cells = [
    { label: 'Today', value: formatDollar(outputs.netToday), colour: undefined },
    { label: 'Oct 2026', value: formatDollar(outputs.octNet), colour: undefined },
    {
      label: 'IC saving',
      value: formatDollar(outputs.icSaving),
      colour: 'var(--color-text-success)',
    },
  ];

  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{ border: '0.5px solid var(--color-border-secondary)' }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className="flex-1 px-4 py-3"
          style={
            i < cells.length - 1
              ? { borderRight: '0.5px solid var(--color-border-secondary)' }
              : undefined
          }
        >
          <p
            className="font-medium"
            style={{
              fontSize: '10px',
              letterSpacing: '1px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {cell.label}
          </p>
          <p
            className="mt-1 font-mono font-medium"
            style={{
              fontSize: '20px',
              color: cell.colour ?? 'var(--color-text-primary)',
            }}
          >
            {cell.value}
          </p>
        </div>
      ))}
    </div>
  );
}
