'use client';

// Zero-cost results variant — shown when planType === 'zero_cost'.
// Critical red banner, before/after cost, all-urgent actions.
// No pass-through slider, no waterfall chart.

import type { ZeroCostOutputs, ActionItem } from '@nosurcharging/calculations/types';
import { ActionList } from './ActionList';

interface ZeroCostResultsVariantProps {
  outputs: ZeroCostOutputs;
  volume: number;
  pspName: string;
  actions: ActionItem[];
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

export function ZeroCostResultsVariant({
  outputs,
  volume,
  pspName,
  actions,
}: ZeroCostResultsVariantProps) {
  const { postReformNetCost, plSwing } = outputs;

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-results px-5 pb-12">
        {/* Critical banner */}
        <div
          className="mt-8 rounded-lg p-6"
          style={{
            background: '#FDF2F2',
            border: '1px solid rgba(191,53,53,0.25)',
          }}
        >
          <p
            className="text-label font-medium"
            style={{ color: 'var(--color-text-danger)', letterSpacing: '1.5px' }}
          >
            CRITICAL — YOUR COSTS CHANGE ON 1 OCTOBER
          </p>
          <h2
            className="mt-3 font-serif font-medium"
            style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
          >
            Your zero-cost plan ends on 1 October 2026
          </h2>
          <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}>
            The surcharge mechanism that currently funds your processing cost is being banned.
            From 1 October, you will pay the full processing cost directly.
          </p>
        </div>

        {/* Before / After */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              Today
            </p>
            <p
              className="mt-2 font-mono"
              style={{ fontSize: '28px', color: 'var(--color-text-success)' }}
            >
              $0
            </p>
            <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              per year
            </p>
          </div>
          <div
            className="rounded-lg p-4 text-center"
            style={{ background: '#FDF2F2', border: '1px solid rgba(191,53,53,0.25)' }}
          >
            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              From 1 October
            </p>
            <p
              className="mt-2 font-mono"
              style={{ fontSize: '28px', color: 'var(--color-text-danger)' }}
            >
              {formatDollar(postReformNetCost)}
            </p>
            <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              per year
            </p>
          </div>
        </div>

        {/* P&L impact */}
        <div className="mt-6 text-center">
          <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            Net annual impact
          </p>
          <p
            className="mt-1 font-mono text-financial-hero"
            style={{ color: 'var(--color-text-danger)' }}
          >
            −{formatDollar(Math.abs(plSwing))}
          </p>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            across {formatDollar(volume)} in annual card revenue
          </p>
        </div>

        {/* Actions — all urgent */}
        <div className="mt-8">
          <ActionList actions={actions} />
        </div>

        {/* Explanation */}
        <div className="mt-8">
          <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}>
            Zero-cost EFTPOS plans work by surcharging customers to cover your processing cost.
            When the surcharge ban takes effect on 1 October 2026, this mechanism ends.
            You need to contact {pspName} immediately to understand your options — either
            transition to a standard plan or negotiate new pricing before October.
          </p>
        </div>
      </div>
    </main>
  );
}
