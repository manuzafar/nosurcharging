'use client';

// Step 2: Plan type selection.
// CB-01: Two visual mock statement cards (not radio buttons).
// CB-03: PSP pill selector (single select, always selected after first pick).
// CB-02: Expert panel + card mix input (optional).
// Both plan type AND PSP must be selected to enable Next.

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
  planType: 'flat' | 'costplus' | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  onPlanTypeChange: (planType: 'flat' | 'costplus') => void;
  onPspChange: (psp: string) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2PlanType({
  planType,
  psp,
  merchantInput,
  onPlanTypeChange,
  onPspChange,
  onMerchantInputChange,
  onNext,
  onBack,
}: Step2PlanTypeProps) {
  const canProceed = planType !== null && psp !== null;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 2</p>
      <h2 className="mt-2 font-serif text-heading-lg">
        What does your card statement look like?
      </h2>
      <p className="mt-2 text-body-sm text-gray-500">
        Pick the card that looks most like your PSP statement.
      </p>

      {/* CB-01: Plan type cards.
          a11y: wrap in role="radiogroup" with aria-label so screen readers
          announce the grouping when the user tabs into the first card. The
          cards themselves are already role="radio" + aria-checked. */}
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
            <PillBadge variant={planType === 'flat' ? 'accent' : 'grey'}>
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
            <PillBadge variant={planType === 'costplus' ? 'accent' : 'grey'}>
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
      </div>

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

      {/* CB-03: PSP selector.
          a11y: single-select pill group. role="radiogroup" + role="radio"
          per pill + aria-checked. tabIndex rolls focus to the active pill
          only (standard radiogroup pattern). min-h-[44px] + px-4 flex
          centering satisfies WCAG 2.5.5 target size. The heading paragraph
          is linked as the group label via aria-labelledby. */}
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

      <div className="mt-8 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}
