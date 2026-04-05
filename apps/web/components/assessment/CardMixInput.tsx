'use client';

// Card mix input — optional section in Step 2.
// 7 fields, all optional. Live total display. Auto-normalise. Never blocks progression.
// Confidence badge updates live as fields are filled.

import { useState } from 'react';
import type { CardMixInput as CardMixInputType } from '@nosurcharging/calculations/types';

const FIELDS: { key: keyof CardMixInputType; label: string }[] = [
  { key: 'visa_debit', label: 'Visa debit' },
  { key: 'visa_credit', label: 'Visa credit' },
  { key: 'mastercard_debit', label: 'Mastercard debit' },
  { key: 'mastercard_credit', label: 'Mastercard credit' },
  { key: 'eftpos', label: 'eftpos' },
  { key: 'amex', label: 'Amex' },
  { key: 'foreign', label: 'Foreign cards' },
];

interface CardMixInputProps {
  value: CardMixInputType;
  onChange: (mix: CardMixInputType) => void;
}

export function CardMixInput({ value, onChange }: CardMixInputProps) {
  const [expanded, setExpanded] = useState(false);

  const filledCount = FIELDS.filter(
    (f) => value[f.key] !== undefined && value[f.key] !== null,
  ).length;

  const total = FIELDS.reduce((sum, f) => {
    const v = value[f.key];
    return sum + (typeof v === 'number' ? v * 100 : 0);
  }, 0);

  const handleChange = (key: keyof CardMixInputType, raw: string) => {
    const parsed = raw === '' ? undefined : parseFloat(raw) / 100;
    onChange({ ...value, [key]: parsed === undefined || isNaN(parsed) ? undefined : parsed });
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-body-sm text-gray-500 underline decoration-gray-300
          underline-offset-2 hover:text-gray-700 transition-colors duration-100"
      >
        {expanded
          ? '← Use default card mix'
          : 'Know your card mix? It improves accuracy →'}
      </button>

      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${
          expanded ? 'mt-3 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-body-sm font-medium text-gray-700">
            How your customers typically pay
          </p>
          <p className="mt-1 text-caption text-gray-400">
            Percentages should add up to 100%
          </p>

          <div className="mt-3 space-y-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-32 text-body-sm text-gray-600">{f.label}</span>
                <div className="relative flex-1 max-w-[100px]">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="—"
                    value={
                      value[f.key] !== undefined && value[f.key] !== null
                        ? Math.round(value[f.key]! * 100)
                        : ''
                    }
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5
                      font-mono text-body-sm outline-none focus:border-amber-400
                      transition-colors duration-150 text-right pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-gray-400">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Live total */}
          <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3">
            <span className="w-32 text-body-sm font-medium text-gray-700">Total</span>
            <span
              className={`font-mono text-body-sm font-medium ${
                filledCount === 0
                  ? 'text-gray-400'
                  : Math.abs(total - 100) <= 1
                    ? 'text-green-700'
                    : 'text-amber-800'
              }`}
            >
              {filledCount === 0 ? '—' : `${total.toFixed(0)}%`}
            </span>
            {filledCount > 0 && Math.abs(total - 100) > 1 && (
              <span className="text-caption text-amber-700">
                — we&apos;ll adjust to 100%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
