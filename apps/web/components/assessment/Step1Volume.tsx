'use client';

// Step 1: Annual card turnover.
// Annual/monthly toggle. Sanity check if annual < $30K.
// All financial numbers in font-mono.

import { useState } from 'react';
import { AmberButton } from '@/components/ui/AmberButton';
import { TextButton } from '@/components/ui/TextButton';

interface Step1VolumeProps {
  value: number;
  onChange: (volume: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step1Volume({ value, onChange, onNext, onBack }: Step1VolumeProps) {
  const [isMonthly, setIsMonthly] = useState(false);
  const [inputValue, setInputValue] = useState(value > 0 ? String(value) : '');

  const handleInputChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setInputValue(cleaned);
    const num = parseInt(cleaned, 10) || 0;
    const annual = isMonthly ? num * 12 : num;
    onChange(annual);
  };

  const handleToggle = (monthly: boolean) => {
    setIsMonthly(monthly);
    const num = parseInt(inputValue, 10) || 0;
    const annual = monthly ? num * 12 : num;
    onChange(annual);
  };

  const annualVolume = value;
  const showWarning = annualVolume > 0 && annualVolume < 30_000;
  const canProceed = annualVolume > 0;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 1</p>
      <h2 className="mt-2 font-serif text-heading-lg">
        How much do you process in card payments?
      </h2>
      <p className="mt-2 text-body-sm text-gray-500">
        Your total annual card turnover — Visa, Mastercard, eftpos, Amex combined.
      </p>

      <div className="mt-6">
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className={`rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors duration-100 ${
              !isMonthly
                ? 'bg-accent-light text-accent-dark border border-accent'
                : 'text-gray-500 border border-gray-200'
            }`}
          >
            Annual
          </button>
          <button
            type="button"
            onClick={() => handleToggle(true)}
            className={`rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors duration-100 ${
              isMonthly
                ? 'bg-accent-light text-accent-dark border border-accent'
                : 'text-gray-500 border border-gray-200'
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-body text-gray-400">
            $
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={isMonthly ? '80,000' : '1,000,000'}
            className="w-full rounded-lg border border-gray-200 py-3 pl-8 pr-4
              font-mono text-financial-standard outline-none
              focus:border-accent transition-colors duration-150"
          />
        </div>

        {annualVolume > 0 && (
          <p className="mt-2 text-body-sm text-gray-400">
            {isMonthly ? 'Annual: ' : ''}
            <span className="font-mono">
              ${annualVolume.toLocaleString('en-AU')}
            </span>
            {isMonthly ? ' per year' : ' per year'}
          </p>
        )}

        {showWarning && (
          <p className="mt-2 text-body-sm text-accent-dark bg-accent-light rounded-lg px-3 py-2">
            Under $30,000 per year — the interchange saving may be small relative to your volume.
            You can still proceed.
          </p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AmberButton onClick={onNext} disabled={!canProceed}>
          Next
        </AmberButton>
      </div>
    </div>
  );
}
