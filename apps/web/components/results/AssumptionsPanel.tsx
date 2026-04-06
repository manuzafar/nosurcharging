'use client';

// CB-10: Assumptions panel — collapsed by default.
// Toggle: "↓ How we calculated this" / "↑ How we calculated this"
// All values read from resolutionTrace — never hardcoded.
// Contains CostBreakdownChart as secondary visual.

import { useState } from 'react';
import { CostBreakdownChart } from '@/components/charts/CostBreakdownChart';
import { trackEvent } from '@/lib/analytics';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';

interface AssumptionsPanelProps {
  outputs: AssessmentOutputs;
  passThrough: number;
  resolutionTrace: ResolutionTrace;
}

const CARD_MIX_KEYS = [
  { key: 'cardMix.visa_debit', label: 'Visa debit' },
  { key: 'cardMix.visa_credit', label: 'Visa credit' },
  { key: 'cardMix.mastercard_debit', label: 'Mastercard debit' },
  { key: 'cardMix.mastercard_credit', label: 'Mastercard credit' },
  { key: 'cardMix.eftpos', label: 'eftpos' },
  { key: 'cardMix.amex', label: 'Amex' },
  { key: 'cardMix.foreign', label: 'Foreign cards' },
];

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'High confidence — calculated from your exact rates',
  medium: 'Estimated — partial RBA averages used',
  low: 'Estimated — RBA averages used for all inputs',
};

export function AssumptionsPanel({
  outputs,
  passThrough,
  resolutionTrace,
}: AssumptionsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Toggle */}
      <button
        type="button"
        onClick={() => {
          if (!expanded) {
            trackEvent('Assumptions opened');
          }
          setExpanded(!expanded);
        }}
        className="text-caption cursor-pointer"
        style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', padding: 0 }}
      >
        {expanded ? '↑' : '↓'} How we calculated this
      </button>

      {/* Expanded content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? 'mt-3 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="rounded-xl p-4"
          style={{ border: '0.5px solid var(--color-border-secondary)' }}
        >
          {/* Card mix section */}
          <p className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Card mix used
          </p>
          <div className="mt-2 space-y-1">
            {CARD_MIX_KEYS.map(({ key, label }) => {
              const entry = resolutionTrace[key];
              if (!entry) return null;
              const pct = (entry.value * 100).toFixed(0);
              return (
                <div key={key} className="flex items-center justify-between text-caption">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span>
                    <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                      {pct}%
                    </span>
                    <span className="ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      ← {entry.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* IC saving rates */}
          <div
            className="mt-4 pt-3 space-y-1"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <p className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
              IC saving rates
            </p>
            <div className="flex justify-between text-caption">
              <span style={{ color: 'var(--color-text-secondary)' }}>Debit IC saving</span>
              <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {resolutionTrace['expertRates.debitCents']?.value ?? 9}c → 8c per transaction
              </span>
            </div>
            <div className="flex justify-between text-caption">
              <span style={{ color: 'var(--color-text-secondary)' }}>Credit IC saving</span>
              <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
                {resolutionTrace['expertRates.creditPct']?.value ?? 0.52}% → 0.30%
              </span>
            </div>
          </div>

          {/* Scheme fees */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <div className="flex justify-between text-caption">
              <span style={{ color: 'var(--color-text-secondary)' }}>Scheme fees</span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                <span className="font-mono">{(outputs.todayScheme).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })}</span>
                <span className="ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  (Unregulated — unchanged by reform)
                </span>
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <div className="flex justify-between text-caption">
              <span style={{ color: 'var(--color-text-secondary)' }}>Confidence</span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {CONFIDENCE_LABELS[outputs.confidence] ?? CONFIDENCE_LABELS.low}
              </span>
            </div>
          </div>

          {/* Source citation */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
              Source:{' '}
              <a
                href="https://www.rba.gov.au/statistics/tables/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                RBA Statistical Tables C1 and C2
              </a>
              , 12 months to January 2026
            </p>
          </div>

          {/* Secondary chart: CostBreakdownChart */}
          <CostBreakdownChart outputs={outputs} passThrough={passThrough} />
        </div>
      </div>
    </div>
  );
}
