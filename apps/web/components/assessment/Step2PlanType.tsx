'use client';

// Step 2: Plan type selection.
// CB-01: Four visual mock statement cards (flat, cost-plus, blended, zero-cost).
// CB-03: PSP pill selector (single select, always selected after first pick).
// CB-02: Expert panel + card mix input (optional).
// Plan type + PSP must be selected to enable Next.
// Zero-cost requires msfRateMode confirmed before proceeding.
// Strategic rate text link exits to inline StrategicRateExitPage.

import { Card } from '@/components/ui/Card';
import { PillBadge } from '@/components/ui/PillBadge';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';
import { ExpertPanel } from './ExpertPanel';
import { CardMixInput } from './CardMixInput';
import type { MerchantInputOverrides, CardMixInput as CardMixInputType } from '@nosurcharging/calculations/types';

const PSP_OPTIONS = [
  'Stripe', 'Square', 'Tyro', 'CommBank', 'ANZ', 'Westpac', 'eWAY', 'Adyen', 'Other',
] as const;

interface Step2PlanTypeProps {
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | null;
  msfRateMode: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate: number | null;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  volume?: number;
  onPlanTypeChange: (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost') => void;
  onMsfRateModeChange: (mode: 'unselected' | 'market_estimate' | 'custom') => void;
  onCustomMSFRateChange: (rate: number | null) => void;
  onBlendedRatesChange: (debit: number | null, credit: number | null) => void;
  onStrategicRateSelected: () => void;
  onPspChange: (psp: string) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2PlanType({
  planType,
  msfRateMode,
  customMSFRate,
  blendedDebitRate,
  blendedCreditRate,
  psp,
  merchantInput,
  volume,
  onPlanTypeChange,
  onMsfRateModeChange,
  onCustomMSFRateChange,
  onBlendedRatesChange,
  onStrategicRateSelected,
  onPspChange,
  onMerchantInputChange,
  onNext,
  onBack,
}: Step2PlanTypeProps) {
  const zeroCostReady = planType !== 'zero_cost'
    || msfRateMode === 'market_estimate'
    || (msfRateMode === 'custom' && customMSFRate !== null && customMSFRate > 0);
  const canProceed = planType !== null && psp !== null && zeroCostReady;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 2</p>
      <h2 className="mt-2 font-serif text-heading-lg">
        What does your card statement look like?
      </h2>
      <p className="mt-2 text-body-sm text-gray-500">
        Pick the card that looks most like your PSP statement.
      </p>

      {/* CB-01: Plan type cards — 2×2 grid.
          a11y: role="radiogroup" with aria-label. Cards are role="radio" + aria-checked. */}
      <div
        role="radiogroup"
        aria-label="Plan type"
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {/* Flat rate card */}
        <Card
          selected={planType === 'flat'}
          onClick={() => onPlanTypeChange('flat')}
          role="radio"
          ariaChecked={planType === 'flat'}
          ariaLabel="Flat rate plan"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body font-medium">One blended rate</p>
              <p className="text-caption text-gray-500">Stripe, Square, Tyro default</p>
            </div>
            <PillBadge variant={planType === 'flat' ? 'amber' : 'grey'}>
              Flat rate
            </PillBadge>
          </div>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption leading-relaxed">
            <div className="flex justify-between">
              <span>Merchant service fee</span>
              <span className="font-medium">1.40%</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Total charged</span>
              <span className="font-medium">$1,400.00</span>
            </div>
          </div>
        </Card>

        {/* Cost-plus card */}
        <Card
          selected={planType === 'costplus'}
          onClick={() => onPlanTypeChange('costplus')}
          role="radio"
          ariaChecked={planType === 'costplus'}
          ariaLabel="Cost-plus plan"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body font-medium">Itemised breakdown</p>
              <p className="text-caption text-gray-500">IC++ or cost-plus</p>
            </div>
            <PillBadge variant={planType === 'costplus' ? 'amber' : 'grey'}>
              Cost-plus
            </PillBadge>
          </div>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption leading-relaxed">
            <div className="flex justify-between text-gray-500">
              <span>Debit interchange</span>
              <span>$312</span>
            </div>
            <div className="mt-0.5 flex justify-between text-gray-500">
              <span>Credit interchange</span>
              <span>$280</span>
            </div>
            <div className="mt-0.5 flex justify-between text-gray-500">
              <span>Scheme fees</span>
              <span>$88</span>
            </div>
            <div className="mt-0.5 flex justify-between text-chart-surcharge">
              <span>PSP margin</span>
              <span>$95</span>
            </div>
          </div>
        </Card>

        {/* Blended rate card */}
        <Card
          selected={planType === 'blended'}
          onClick={() => onPlanTypeChange('blended')}
          role="radio"
          ariaChecked={planType === 'blended'}
          ariaLabel="Blended rate plan"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body font-medium">Different rates for different cards</p>
              <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                Westpac, Airwallex, some banks
              </p>
            </div>
            <PillBadge variant={planType === 'blended' ? 'amber' : 'grey'}>
              Blended
            </PillBadge>
          </div>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption leading-relaxed">
            <div className="flex justify-between text-gray-500">
              <span>Debit</span>
              <span>0.90%</span>
            </div>
            <div className="mt-0.5 flex justify-between text-gray-500">
              <span>Credit</span>
              <span>1.60%</span>
            </div>
          </div>
        </Card>

        {/* Zero-cost card */}
        <Card
          selected={planType === 'zero_cost'}
          onClick={() => onPlanTypeChange('zero_cost')}
          role="radio"
          ariaChecked={planType === 'zero_cost'}
          ariaLabel="Zero-cost EFTPOS plan"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body font-medium">Zero-cost — I pay nothing</p>
              <p className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
                Smartpay / Shift4, Tyro zero-cost
              </p>
            </div>
            <PillBadge variant={planType === 'zero_cost' ? 'amber' : 'grey'}>
              Zero-cost
            </PillBadge>
          </div>
          <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-caption leading-relaxed">
            <div className="flex justify-between">
              <span>Your payment cost</span>
              <span style={{ color: 'var(--color-text-success)' }}>$0.00</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: '#BA7517' }}>
              Most affected by October reform
            </div>
          </div>
        </Card>
      </div>

      {/* Zero-cost warning panel — three-state msfRateMode */}
      {planType === 'zero_cost' && (
        <div
          className="mt-4 rounded-lg"
          style={{
            background: '#FDF2F2',
            borderLeft: '3px solid var(--color-text-danger)',
            border: '1px solid rgba(191,53,53,0.25)',
            padding: '16px',
          }}
        >
          <p
            className="text-label"
            style={{ color: 'var(--color-text-danger)', letterSpacing: '1.2px' }}
          >
            ACTION REQUIRED
          </p>
          <p
            className="mt-1 text-body-sm font-medium"
            style={{ color: 'var(--color-text-danger)' }}
          >
            Your zero-cost plan ends on 1 October 2026
          </p>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            The surcharge mechanism ends. You will pay the full processing cost from October.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onMsfRateModeChange('market_estimate')}
              className={`rounded-pill border px-3 py-1.5 text-caption transition-all ${
                msfRateMode === 'market_estimate'
                  ? 'border-red-400 bg-red-100 text-red-800'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              Use 1.4% market estimate
            </button>
            <button
              type="button"
              onClick={() => onMsfRateModeChange('custom')}
              className={`rounded-pill border px-3 py-1.5 text-caption transition-all ${
                msfRateMode === 'custom'
                  ? 'border-red-400 bg-red-100 text-red-800'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              I have a confirmed rate
            </button>
          </div>

          {msfRateMode === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                placeholder="e.g. 1.3"
                step="0.01"
                min="0.1"
                max="5"
                className="w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onCustomMSFRateChange(isNaN(v) || v <= 0 ? null : v / 100);
                }}
              />
              <span className="text-caption text-gray-400">%</span>
            </div>
          )}

          {(msfRateMode === 'market_estimate' || (msfRateMode === 'custom' && customMSFRate)) && (
            <p className="mt-2 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              At {((msfRateMode === 'market_estimate' ? 0.014 : customMSFRate!) * 100).toFixed(1)}%,
              you would pay approximately{' '}
              <strong>
                ${Math.round((volume ?? 0) * (msfRateMode === 'market_estimate' ? 0.014 : customMSFRate!))
                    .toLocaleString('en-AU')}/year
              </strong>
              {' '}from 1 October.
            </p>
          )}
        </div>
      )}

      {/* Blended optional rate panel */}
      {planType === 'blended' && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-body-sm font-medium">
            Optional: enter your rates for a more accurate estimate
          </p>
          <p className="mt-1 text-caption text-gray-400">
            Find on your monthly statement. Leave blank to use RBA averages.
          </p>
          <div className="mt-3 flex gap-4">
            <div>
              <label className="text-caption text-gray-500">Debit rate (%)</label>
              <input
                type="number"
                placeholder="e.g. 0.9"
                step="0.01"
                min="0"
                max="5"
                className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onBlendedRatesChange(isNaN(v) ? null : v / 100, blendedCreditRate);
                }}
              />
            </div>
            <div>
              <label className="text-caption text-gray-500">Credit rate (%)</label>
              <input
                type="number"
                placeholder="e.g. 1.6"
                step="0.01"
                min="0"
                max="5"
                className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1 font-mono text-caption"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onBlendedRatesChange(blendedDebitRate, isNaN(v) ? null : v / 100);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CB-02: Expert panel */}
      <ExpertPanel
        expertRates={merchantInput.expertRates}
        onChange={(rates) => onMerchantInputChange({ ...merchantInput, expertRates: rates })}
      />

      {/* Card mix input */}
      <CardMixInput
        value={merchantInput.cardMix ?? {}}
        onChange={(mix: CardMixInputType) =>
          onMerchantInputChange({ ...merchantInput, cardMix: mix })
        }
      />

      {/* CB-03: PSP selector */}
      <div className="mt-6">
        <p id="psp-selector-label" className="text-body-sm font-medium tracking-wide">
          Who processes your payments?
        </p>
        <div
          role="radiogroup"
          aria-labelledby="psp-selector-label"
          className="mt-2 flex flex-wrap gap-2"
        >
          {PSP_OPTIONS.map((name) => {
            const selected = psp === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (psp === null && name === PSP_OPTIONS[0]) ? 0 : -1}
                onClick={() => onPspChange(name)}
                className={`flex min-h-[44px] items-center justify-center rounded-lg px-4 text-caption transition-all duration-100 ${
                  selected
                    ? 'border border-accent bg-accent-light text-accent-dark'
                    : 'border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
                style={{ borderWidth: selected ? '1px' : '0.5px' }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strategic rate text link */}
      <div className="mt-3">
        <button
          type="button"
          onClick={onStrategicRateSelected}
          className="text-caption underline underline-offset-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Processing $50M+ in card payments? You may have a strategic rate
        </button>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}
