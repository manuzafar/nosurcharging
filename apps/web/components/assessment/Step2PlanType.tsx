'use client';

// Step 2 — tiered plan-type hierarchy per ASSESSMENT_STEP2_REDESIGN_BRIEF.md.
// Tier 1: Flat rate ("Most common") + "I'm not sure" ("Smart defaults").
// Tier 2: cost-plus / zero-cost / blended (less common).
// Tier 3: strategic custom-rate exit (wide single card).
// PSP grid + optional refinement rows below.
// Refinements hidden when "I'm not sure" is selected — keeps the
// most-confused cohort on the lowest-friction path. PSP stays visible.

import { useState } from 'react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';
import { ExpertPanel } from './ExpertPanel';
import { CardMixInput } from './CardMixInput';
import type { MerchantInputOverrides, CardMixInput as CardMixInputType } from '@nosurcharging/calculations/types';
import { PSP_PUBLISHED_RATES, PSP_RATES_AS_OF } from '@nosurcharging/calculations/constants/psp-rates';

const PSP_OPTIONS = [
  'Stripe', 'Square', 'Tyro', 'CommBank', 'ANZ', 'Westpac', 'Zeller', 'eWAY', 'Adyen', 'Other',
] as const;

interface Step2PlanTypeProps {
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate' | null;
  msfRateMode: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate: number | null;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  volume?: number;
  msfRate: number;
  onMsfRateChange: (rate: number) => void;
  onPlanTypeChange: (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost', unknown?: boolean) => void;
  onMsfRateModeChange: (mode: 'unselected' | 'market_estimate' | 'custom') => void;
  onCustomMSFRateChange: (rate: number | null) => void;
  onBlendedRatesChange: (debit: number | null, credit: number | null) => void;
  onStrategicRateSelected: () => void;
  onPspChange: (psp: string) => void;
  onMerchantInputChange: (input: MerchantInputOverrides) => void;
  onNext: () => void;
  onBack: () => void;
}

function MockBar({ width, green }: { width: number; green?: boolean }) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: '8px',
        borderRadius: '3px',
        background: green ? '#C0DD97' : 'var(--color-border-secondary)',
        flexShrink: 0,
      }}
    />
  );
}

function TechTag({ children }: { children: string }) {
  return (
    <p
      className="font-mono"
      style={{
        fontSize: '10px',
        color: 'var(--color-text-tertiary)',
        marginTop: '8px',
        letterSpacing: '0.3px',
      }}
    >
      {children}
    </p>
  );
}

// Lucide-style outline. 18px, inherits color via currentColor stroke.
function HelpCircleIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const TILE_SELECTED = {
  border: '1.5px solid #1A6B5A',
  background: '#EBF6F3',
  transition: 'border 120ms ease, background 120ms ease',
} as const;

const TILE_UNSELECTED = {
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  transition: 'border 120ms ease, background 120ms ease',
} as const;

// Section subhead — DM Sans 11px weight 500 letter-spacing 0.14em uppercase.
function SectionSubhead({ children, mt = 28 }: { children: string; mt?: number }) {
  return (
    <p
      className="font-medium uppercase"
      style={{
        fontSize: '11px',
        letterSpacing: '2px',
        color: 'var(--color-text-tertiary)',
        marginTop: `${mt}px`,
        marginBottom: '12px',
      }}
    >
      {children}
    </p>
  );
}

// Hairline divider with centered uppercase mono label.
function HairlineDivider({ label }: { label: string }) {
  return (
    <div
      className="flex items-center"
      style={{ gap: '12px', marginTop: '24px', marginBottom: '20px' }}
    >
      <div style={{ flex: 1, borderTop: '0.5px solid var(--color-border-tertiary)' }} />
      <span
        className="font-mono uppercase"
        style={{
          fontSize: '10px',
          letterSpacing: '1.4px',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, borderTop: '0.5px solid var(--color-border-tertiary)' }} />
    </div>
  );
}

// Corner chip badge — used on Tier 1 cards.
function CornerChip({
  label,
  variant,
}: {
  label: string;
  variant: 'success' | 'info';
}) {
  const bg = variant === 'success' ? 'var(--color-background-success)' : 'var(--color-background-info)';
  const fg = variant === 'success' ? 'var(--color-text-success)' : 'var(--color-text-info)';
  const border = variant === 'success' ? 'var(--color-border-success)' : 'var(--color-border-info)';
  return (
    <span
      className="font-mono uppercase"
      style={{
        position: 'absolute',
        top: '-7px',
        right: '14px',
        fontSize: '10px',
        letterSpacing: '0.6px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: bg,
        color: fg,
        border: `0.5px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
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
  msfRate,
  onMsfRateChange,
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
  const [isUnknown, setIsUnknown] = useState(false);
  const [strategicSelected, setStrategicSelected] = useState(false);

  const zeroCostReady = planType !== 'zero_cost'
    || msfRateMode === 'market_estimate'
    || (msfRateMode === 'custom' && customMSFRate !== null && customMSFRate > 0);
  const canProceed = strategicSelected || (planType !== null && psp !== null && zeroCostReady);

  const handlePlanTypeSelect = (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost') => {
    setIsUnknown(false);
    setStrategicSelected(false);
    onPlanTypeChange(pt, false);
  };

  const handleDontKnow = () => {
    setIsUnknown(true);
    setStrategicSelected(false);
    onPlanTypeChange('flat', true);
  };

  const handleStrategicSelect = () => {
    setStrategicSelected(true);
    setIsUnknown(false);
  };

  const handleNext = () => {
    if (strategicSelected) {
      onStrategicRateSelected();
    } else {
      onNext();
    }
  };

  const isSelected = (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost') =>
    planType === pt && !isUnknown && !strategicSelected;
  const isDontKnowSelected = isUnknown && planType === 'flat' && !strategicSelected;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 2</p>
      <h2
        className="mt-2 font-serif text-ink"
        style={{ fontSize: '26px', lineHeight: '1.15', letterSpacing: '-0.5px', fontWeight: 500 }}
      >
        How do you pay for card acceptance?
      </h2>
      <p
        className="mt-2"
        style={{ fontSize: '14px', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}
      >
        Pick the description that sounds most like your situation —
        you don&apos;t need your statement in front of you.
      </p>

      <SectionSubhead>Your plan type</SectionSubhead>

      {/* ── Tier 1: Flat + I'm not sure (prominent, 2-col grid) ─── */}
      <div
        role="radiogroup"
        aria-label="Primary plan paths"
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {/* Card A — Flat rate */}
        <div
          role="radio"
          aria-checked={isSelected('flat')}
          aria-label="I pay a single rate on every transaction"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('flat')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('flat'); } }}
          className="relative cursor-pointer rounded-xl"
          style={{
            ...(isSelected('flat') ? TILE_SELECTED : TILE_UNSELECTED),
            padding: '20px',
          }}
        >
          <CornerChip label="Most common" variant="success" />
          <p
            className="font-medium"
            style={{ fontSize: '15px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
          >
            I pay a single rate on every transaction
          </p>
          <p
            className="italic"
            style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '4px' }}
          >
            One line — one percentage — covers everything
          </p>
          <TechTag>flat rate · blended MSF · single percentage</TechTag>

          <div
            className="mt-3 rounded-lg p-3"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Merchant service fee</span>
              <MockBar width={60} />
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', margin: '6px 0' }} />
            <div className="flex items-center justify-between" style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              <span>Total charged</span>
              <MockBar width={52} />
            </div>
          </div>
        </div>

        {/* Card B — I'm not sure (promoted from below-grid to tier 1) */}
        <div
          role="radio"
          aria-checked={isDontKnowSelected}
          aria-label="I'm not sure how I pay for card acceptance"
          tabIndex={0}
          onClick={handleDontKnow}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDontKnow(); } }}
          className="relative cursor-pointer rounded-xl"
          style={{
            ...(isDontKnowSelected ? TILE_SELECTED : TILE_UNSELECTED),
            padding: '20px',
          }}
        >
          <CornerChip label="Smart defaults" variant="info" />
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: '36px',
                height: '36px',
                background: isDontKnowSelected ? '#1A6B5A' : '#EBF6F3',
                color: isDontKnowSelected ? '#fff' : '#0D3D32',
              }}
            >
              <HelpCircleIcon />
            </span>
            <div className="flex-1">
              <p
                className="font-medium"
                style={{ fontSize: '15px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
              >
                I&apos;m not sure how I pay for card acceptance
              </p>
              <p
                className="italic"
                style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '4px' }}
              >
                No statement handy? No idea what plan you&apos;re on?
              </p>
            </div>
          </div>
          <p
            className="mt-3"
            style={{ fontSize: '12px', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}
          >
            We&apos;ll use the most common assumptions (flat rate, RBA card mix averages)
            and clearly flag every default in your report. You can refine later.
          </p>
        </div>
      </div>

      <HairlineDivider label="If you recognise one of these" />

      {/* ── Tier 2: cost-plus / zero-cost / blended (secondary) ── */}
      <div
        role="radiogroup"
        aria-label="Less common plan types"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {/* Cost-plus tile */}
        <div
          role="radio"
          aria-checked={isSelected('costplus')}
          aria-label="I see a list of separate charges on my bill"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('costplus')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('costplus'); } }}
          className="cursor-pointer rounded-xl"
          style={{
            ...(isSelected('costplus') ? TILE_SELECTED : TILE_UNSELECTED),
            padding: '14px',
          }}
        >
          <p
            className="font-medium"
            style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
          >
            I see a list of separate charges on my bill
          </p>
          <p
            className="italic"
            style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '2px' }}
          >
            Multiple line items — different amounts for different costs
          </p>
          <TechTag>IC++ · cost-plus</TechTag>

          <div
            className="mt-2 rounded-lg p-2"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>Processing costs</span>
              <MockBar width={42} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>Card scheme fees</span>
              <MockBar width={28} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>Provider margin</span>
              <MockBar width={20} green />
            </div>
          </div>
        </div>

        {/* Zero-cost tile */}
        <div
          role="radio"
          aria-checked={isSelected('zero_cost')}
          aria-label="I pass the fee to my customers and keep my full margin"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('zero_cost')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('zero_cost'); } }}
          className="cursor-pointer rounded-xl"
          style={{
            ...(isSelected('zero_cost') ? TILE_SELECTED : TILE_UNSELECTED),
            padding: '14px',
          }}
        >
          <p
            className="font-medium"
            style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
          >
            I pass the fee to my customers
          </p>
          <p
            className="italic"
            style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '2px' }}
          >
            Surcharge model — I keep my full margin
          </p>
          <TechTag>no-cost EFTPOS</TechTag>

          <div
            className="mt-2 rounded-lg p-2"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center gap-2" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: '14px', height: '14px', background: 'var(--color-border-secondary)', fontSize: '8px', flexShrink: 0 }}
              >
                C
              </span>
              <span>Customer pays fee</span>
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', margin: '4px 0' }} />
            <div className="flex items-center gap-2" style={{ fontSize: '10px' }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: '14px', height: '14px', background: '#EBF6F3', color: '#0D3D32', fontSize: '8px', flexShrink: 0 }}
              >
                M
              </span>
              <span style={{ fontWeight: 500, color: '#0D3D32' }}>
                I receive full price
              </span>
            </div>
          </div>
        </div>

        {/* Blended tile */}
        <div
          role="radio"
          aria-checked={isSelected('blended')}
          aria-label="I pay different amounts for debit vs credit cards"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('blended')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('blended'); } }}
          className="cursor-pointer rounded-xl"
          style={{
            ...(isSelected('blended') ? TILE_SELECTED : TILE_UNSELECTED),
            padding: '14px',
          }}
        >
          <p
            className="font-medium"
            style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
          >
            Different debit vs credit rates
          </p>
          <p
            className="italic"
            style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '2px' }}
          >
            Two rates — one for debit, one for credit
          </p>
          <TechTag>blended · tiered rates</TechTag>

          <div
            className="mt-2 rounded-lg p-2"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>Debit transactions</span>
              <MockBar width={28} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
              <span>Credit transactions</span>
              <MockBar width={42} />
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', margin: '4px 0' }} />
            <div className="flex items-center justify-between" style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              <span>Total charged</span>
              <MockBar width={48} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Conditional sub-panels (unchanged logic) ──────────── */}
      {planType === 'zero_cost' && !isUnknown && !strategicSelected && (
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

      {planType === 'blended' && !isUnknown && !strategicSelected && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-body-sm font-medium">
            Optional: enter your rates for a more accurate estimate
          </p>
          <p className="mt-1 text-caption text-gray-400">
            Find on your monthly statement. Leave blank to use market averages.
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

      <HairlineDivider label="Or" />

      {/* ── Tier 3: Strategic custom-rate (wide single card) ──── */}
      <div
        role="radio"
        aria-checked={strategicSelected}
        aria-label="I'm on a custom rate I negotiated for my business"
        tabIndex={0}
        onClick={handleStrategicSelect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStrategicSelect(); } }}
        className="flex cursor-pointer items-center justify-between rounded-xl"
        style={{
          ...(strategicSelected ? TILE_SELECTED : TILE_UNSELECTED),
          padding: '16px 20px',
          gap: '16px',
        }}
      >
        <div>
          <p
            className="font-medium"
            style={{ fontSize: '14px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}
          >
            I&apos;m on a custom rate negotiated for my business
          </p>
          <p
            className="italic"
            style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginTop: '2px' }}
          >
            Bespoke rate — not a standard published plan
          </p>
        </div>
        <span
          className="font-mono flex-shrink-0 hidden sm:block"
          style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}
        >
          Large volume · individually negotiated
        </span>
      </div>

      <SectionSubhead>Who processes your payments?</SectionSubhead>

      <div
        role="radiogroup"
        aria-label="Payment processor"
        className="grid grid-cols-2 gap-2 md:grid-cols-4"
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
              className="flex min-h-[44px] items-center justify-center rounded-pill px-4 text-caption cursor-pointer"
              style={{
                border: selected ? '1px solid #1A6B5A' : '0.5px solid var(--color-border-secondary)',
                background: selected ? '#EBF6F3' : 'var(--color-background-primary)',
                color: selected ? '#0D3D32' : 'var(--color-text-secondary)',
                transition: 'all 100ms ease',
              }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Flat-rate MSF pre-fill — unchanged logic, shown for flat + PSP. */}
      {planType === 'flat' && !isUnknown && psp && PSP_PUBLISHED_RATES[psp] && (
        <div
          className="mt-4 rounded-lg"
          style={{
            border: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-secondary)',
            padding: '16px',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Your {psp} rate
            </p>
            <span
              className="inline-block rounded-pill text-micro font-medium"
              style={{
                padding: '2px 8px',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-tertiary)',
                border: '0.5px solid var(--color-border-tertiary)',
              }}
            >
              {psp} standard rate — confirm or update
            </span>
          </div>
          <p className="mt-1 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Published {PSP_RATES_AS_OF}. Verify with your PSP for your specific rate.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.1"
              max="5"
              value={Number((msfRate * 100).toFixed(2))}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) onMsfRateChange(v / 100);
              }}
              className="w-24 rounded-lg px-2 py-1 font-mono text-body-sm outline-none min-h-[40px]"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
              }}
            />
            <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>%</span>
          </div>
        </div>
      )}

      {/* ── Optional refinements (hidden for "I'm not sure" cohort) ──
          The internal toggle inside ExpertPanel / CardMixInput stays
          as the affordance — the bordered container provides the
          new visual framing per the brief without modifying the
          locked component data models. */}
      {!isUnknown && (
        <>
          <SectionSubhead mt={32}>Refine your estimate (optional)</SectionSubhead>

          {/* [&>div]:!mt-0 neutralises the mt-4 on the panels' root divs —
              without it the inner top margin stacks with this container's
              padding and the row reads ~30px taller than it needs to. */}
          <div
            className="rounded-xl [&>div]:!mt-0"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              padding: '12px 16px',
            }}
          >
            <CardMixInput
              value={merchantInput.cardMix ?? {}}
              onChange={(mix: CardMixInputType) =>
                onMerchantInputChange({ ...merchantInput, cardMix: mix })
              }
            />
          </div>

          <div
            className="mt-3 rounded-xl [&>div]:!mt-0"
            style={{
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              padding: '12px 16px',
            }}
          >
            <ExpertPanel
              expertRates={merchantInput.expertRates}
              onChange={(rates) => onMerchantInputChange({ ...merchantInput, expertRates: rates })}
            />
          </div>
        </>
      )}

      <div className="mt-10 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={handleNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}
