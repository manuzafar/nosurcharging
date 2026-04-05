'use client';

// CB-02: Expert Toggle Panel.
// "Payment wizard? Enter your exact rates →"
// 3 optional fields: debit cents, credit %, PSP margin %.
// Confidence badge updates live.
// State persists through Steps 3/4.

import { useState } from 'react';
import type { MerchantInputOverrides } from '@nosurcharging/calculations/types';

interface ExpertPanelProps {
  expertRates: MerchantInputOverrides['expertRates'];
  onChange: (rates: MerchantInputOverrides['expertRates']) => void;
}

export function ExpertPanel({ expertRates, onChange }: ExpertPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const hasAnyInput =
    expertRates?.debitCents !== undefined ||
    expertRates?.creditPct !== undefined ||
    expertRates?.marginPct !== undefined;

  const handleChange = (field: 'debitCents' | 'creditPct' | 'marginPct', raw: string) => {
    const value = raw === '' ? undefined : parseFloat(raw);
    onChange({ ...expertRates, [field]: isNaN(value as number) ? undefined : value });
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-body-sm text-gray-500 underline decoration-gray-300
          underline-offset-2 hover:text-gray-700 transition-colors duration-100"
      >
        {expanded ? '← Use smart defaults instead' : 'Payment wizard? Enter your exact rates →'}
      </button>

      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${
          expanded ? 'mt-3 max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-body-sm font-medium text-gray-700">
            Your actual interchange rates
          </p>
          <p className="mt-1 text-caption text-gray-400">
            Leave blank to use RBA averages
          </p>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <label className="text-micro text-gray-500 tracking-wide">
                Debit (cents/txn)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="9"
                value={expertRates?.debitCents ?? ''}
                onChange={(e) => handleChange('debitCents', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2
                  font-mono text-body-sm outline-none focus:border-amber-400
                  transition-colors duration-150"
              />
            </div>
            <div>
              <label className="text-micro text-gray-500 tracking-wide">
                Credit (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.52"
                value={expertRates?.creditPct ?? ''}
                onChange={(e) => handleChange('creditPct', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2
                  font-mono text-body-sm outline-none focus:border-amber-400
                  transition-colors duration-150"
              />
            </div>
            <div>
              <label className="text-micro text-gray-500 tracking-wide">
                PSP margin (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.10"
                value={expertRates?.marginPct ?? ''}
                onChange={(e) => handleChange('marginPct', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2
                  font-mono text-body-sm outline-none focus:border-amber-400
                  transition-colors duration-150"
              />
            </div>
          </div>

          <p className="mt-3 text-caption text-gray-400">
            Scheme fees default to RBA averages. Unregulated. Unchanged by reform.
          </p>

          {/* Confidence badge — updates live. Exact colours from CB-02 spec. */}
          <div
            className="mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-caption font-medium"
            style={
              hasAnyInput
                ? {
                    background: 'var(--color-background-success)',
                    color: 'var(--color-text-success)',
                    border: '0.5px solid var(--color-border-success)',
                  }
                : {
                    background: 'var(--color-background-warning)',
                    color: 'var(--color-text-warning)',
                    border: '0.5px solid var(--color-border-warning)',
                  }
            }
          >
            {hasAnyInput
              ? 'Calculated from your exact rates'
              : 'Will use RBA averages'}
          </div>
        </div>
      </div>
    </div>
  );
}
