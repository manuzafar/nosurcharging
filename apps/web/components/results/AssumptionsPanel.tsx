'use client';

// AssumptionsPanel — collapsible "show your working" per ux-spec §3.9.
// No embedded chart anymore (moved to CostCompositionChart in commit 4i).
// Each formula row has three parts:
//   Label   — what this is
//   Formula — the arithmetic (the new bit)
//   Value   — the result
// Followed by the existing card-mix breakdown read from resolutionTrace.

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';

interface AssumptionsPanelProps {
  outputs: AssessmentOutputs;
  passThrough: number;
  resolutionTrace: ResolutionTrace;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
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

function formatCurrency(amount: number, sign: '+' | '-' | '' = ''): string {
  const abs = Math.abs(Math.round(amount));
  return `${sign}$${abs.toLocaleString('en-AU')}`;
}

function formatVolume(v: number): string {
  return `$${Math.round(v).toLocaleString('en-AU')}`;
}

function formatPct(rate: number, digits = 2): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

interface FormulaRow {
  label: string;
  formula: string;
  value: string;
  valueColour?: string;
}

export function AssumptionsPanel({
  outputs,
  passThrough,
  resolutionTrace,
  volume,
  pspName,
  planType,
  msfRate,
  surcharging,
  surchargeRate,
}: AssumptionsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // ── Build formula rows ───────────────────────────────────────
  const isFlatRate = planType === 'flat';
  const formulaRows: FormulaRow[] = [];

  if (isFlatRate) {
    formulaRows.push({
      label: `What you pay ${pspName} today`,
      formula: `${formatVolume(volume)} × ${formatPct(msfRate)} flat rate`,
      value: formatCurrency(outputs.annualMSF),
    });
  } else {
    formulaRows.push({
      label: 'What you pay today',
      formula: 'Interchange + scheme fees + margin',
      value: formatCurrency(outputs.grossCOA),
    });
  }

  if (surcharging && outputs.surchargeRevenue > 0) {
    formulaRows.push({
      label: 'Surcharge you currently recover',
      formula: `${formatVolume(volume)} × ${formatPct(surchargeRate)} on Visa/Mastercard/eftpos`,
      value: formatCurrency(outputs.surchargeRevenue, '-'),
      valueColour: 'var(--color-text-danger)',
    });
  }

  if (outputs.debitSaving > 0) {
    formulaRows.push({
      label: 'Debit IC saving (October)',
      // Lower-of clause: the new cap is min(8c, 0.16% × avg sale) — accurate
      // both above and below the $50 kink point.
      formula: 'min(8c, 0.16% × avg sale) per debit transaction',
      value: formatCurrency(outputs.debitSaving, '+'),
      valueColour: 'var(--color-text-success)',
    });
  }
  if (outputs.creditSaving > 0) {
    // Derive current credit rate from the resolution trace so the formula
    // row reflects the actual rate used in the calculation.
    const creditTrace = resolutionTrace['expertRates.creditPct'];
    const creditPct = creditTrace?.value ?? 0.47;
    formulaRows.push({
      label: 'Credit IC saving (October)',
      formula: `${formatPct(creditPct / 100)} → 0.30% on credit volume`,
      value: formatCurrency(outputs.creditSaving, '+'),
      valueColour: 'var(--color-text-success)',
    });
  }

  if (isFlatRate) {
    formulaRows.push({
      label: 'Pass-through to your rate',
      formula: `${Math.round(passThrough * 100)}% of total IC saving`,
      value: formatCurrency(outputs.icSaving * passThrough, '+'),
      valueColour: 'var(--color-text-success)',
    });
  }

  formulaRows.push({
    label: 'Net P&L impact (October)',
    formula: isFlatRate
      ? 'Saving reaching your rate − surcharge revenue'
      : 'Total IC saving − surcharge revenue',
    value: formatCurrency(outputs.plSwing, outputs.plSwing >= 0 ? '+' : '-'),
    valueColour:
      outputs.plSwing >= 0
        ? 'var(--color-text-success)'
        : 'var(--color-text-danger)',
  });

  return (
    <div>
      {/* Toggle — new wording per spec §3.9 */}
      <button
        type="button"
        onClick={() => {
          if (!expanded) {
            trackEvent('Assumptions opened');
          }
          setExpanded(!expanded);
        }}
        className="text-caption cursor-pointer"
        style={{
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        {expanded ? '↑' : '↓'} Show me exactly how this is calculated
      </button>

      {/* Expanded content */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? 'mt-3 max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="p-4"
          style={{ border: '0.5px solid var(--color-border-secondary)' }}
        >
          {/* Formula rows */}
          <p
            className="text-caption font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            How the numbers are built
          </p>
          <div className="mt-2 space-y-3">
            {formulaRows.map((row, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p
                    className="text-caption"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {row.label}
                  </p>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    {row.formula}
                  </p>
                </div>
                <span
                  className="font-mono font-medium shrink-0"
                  style={{
                    fontSize: '13px',
                    color: row.valueColour ?? 'var(--color-text-primary)',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Scheme fees inline italic note */}
          <p
            className="mt-3"
            style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            Visa and Mastercard charge a separate network fee (~
            {formatCurrency(outputs.todayScheme)}/year on your volume). Not
            regulated by the RBA reform. Already included in your {pspName}{' '}
            {isFlatRate ? 'flat rate today' : 'bill today'}.
          </p>

          {/* Card mix section */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <p
              className="text-caption font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Card mix used
            </p>
            <div className="mt-2 space-y-1">
              {CARD_MIX_KEYS.map(({ key, label }) => {
                const entry = resolutionTrace[key];
                if (!entry) return null;
                const pct = (entry.value * 100).toFixed(0);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between text-caption"
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {label}
                    </span>
                    <span>
                      <span
                        className="font-mono"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {pct}%
                      </span>
                      <span
                        className="ml-2"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        ← {entry.label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confidence */}
          <div
            className="mt-4 pt-3"
            style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
          >
            <div className="flex justify-between text-caption">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                Confidence
              </span>
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
            <p
              className="text-caption"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
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
        </div>
      </div>
    </div>
  );
}
