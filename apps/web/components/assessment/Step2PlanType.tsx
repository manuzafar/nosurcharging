'use client';

// Step 2: Plan type selection — structure-recognition tiles.
// CB-01: Six tiles (flat, costplus, zero_cost, blended, strategic, don't-know).
//        Mocks use grey bars to show bill STRUCTURE, not specific rates.
// CB-03: PSP pill selector (single select, below tiles).
// CB-02: Expert panel + card mix input (optional, bottom).
// Plan type + PSP must be selected to enable Next.
// Zero-cost requires msfRateMode confirmed before proceeding.
// Strategic rate tile triggers onStrategicRateSelected — UNCHANGED.
// "Don't know" maps internally to planType='flat' with isUnknown visual state.

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
  // 'strategic_rate' is accepted for parent-state compatibility, but the
  // strategic tile uses its own internal `strategicSelected` boolean —
  // the component never reads `planType === 'strategic_rate'` directly.
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate' | null;
  msfRateMode: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate: number | null;
  blendedDebitRate: number | null;
  blendedCreditRate: number | null;
  psp: string | null;
  merchantInput: MerchantInputOverrides;
  volume?: number;
  // SPRINT_BRIEF.md Sprint 2 UX-06: flat-rate MSF is pre-filled from
  // PSP_PUBLISHED_RATES when the merchant selects a PSP. Displayed in an
  // inline editable field for the flat plan tile only.
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

// ── Grey bar mock component ──────────────────────────────────────
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

// ── Tech tag (muted, small) ──────────────────────────────────────
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

// ── Selection state styles ───────────────────────────────────────
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
  // "Don't know" is a visual-only state — maps to planType='flat' internally
  const [isUnknown, setIsUnknown] = useState(false);
  // Strategic rate is a visual selection — only fires exit on Next click
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

  // Visual selection helpers
  const isSelected = (pt: 'flat' | 'costplus' | 'blended' | 'zero_cost') =>
    planType === pt && !isUnknown && !strategicSelected;
  const isDontKnowSelected = isUnknown && planType === 'flat' && !strategicSelected;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 2</p>
      <h2 className="mt-2 font-serif text-heading-lg">
        How do you pay for card acceptance?
      </h2>
      <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Pick the description that sounds most like your situation —
        you don&apos;t need your statement in front of you.
      </p>

      {/* Section label */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--color-text-tertiary)',
          marginTop: '24px',
          marginBottom: '12px',
        }}
      >
        Your plan type
      </p>

      {/* ── Row 1: Flat + Cost-plus (primary grid) ─────────────── */}
      <div
        role="radiogroup"
        aria-label="Plan type"
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {/* Flat rate tile */}
        <div
          role="radio"
          aria-checked={isSelected('flat')}
          aria-label="I pay a single rate on every transaction"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('flat')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('flat'); } }}
          className="cursor-pointer rounded-xl p-4"
          style={isSelected('flat') ? TILE_SELECTED : TILE_UNSELECTED}
        >
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I pay a single rate on every transaction
          </p>
          <p className="text-caption italic" style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            One line — one percentage — covers everything
          </p>
          <TechTag>flat rate · blended MSF · single percentage</TechTag>

          {/* Mock bill — structure only */}
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

        {/* Cost-plus tile */}
        <div
          role="radio"
          aria-checked={isSelected('costplus')}
          aria-label="I see a list of separate charges on my bill"
          tabIndex={0}
          onClick={() => handlePlanTypeSelect('costplus')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlanTypeSelect('costplus'); } }}
          className="cursor-pointer rounded-xl p-4"
          style={isSelected('costplus') ? TILE_SELECTED : TILE_UNSELECTED}
        >
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I see a list of separate charges on my bill
          </p>
          <p className="text-caption italic" style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            Multiple line items — different amounts for different costs
          </p>
          <TechTag>IC++ · cost-plus · interchange-plus</TechTag>

          <div
            className="mt-3 rounded-lg p-3"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Payment processing costs</span>
              <MockBar width={60} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Payment method costs</span>
              <MockBar width={52} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Card scheme fees</span>
              <MockBar width={36} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Provider margin</span>
              <MockBar width={28} green />
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
          className="cursor-pointer rounded-xl p-4"
          style={isSelected('zero_cost') ? TILE_SELECTED : TILE_UNSELECTED}
        >
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I pass the fee to my customers and keep my full margin
          </p>
          <TechTag>no-cost EFTPOS · fee-free · surcharge model</TechTag>

          <div
            className="mt-3 rounded-lg p-3"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: '18px', height: '18px', background: 'var(--color-border-secondary)', fontSize: '9px', flexShrink: 0 }}
              >
                C
              </span>
              <span>Customer pays sale price</span>
            </div>
            <div className="my-1 flex items-center gap-2" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span style={{ width: '18px', textAlign: 'center', flexShrink: 0 }}>↓</span>
              <span>card fee passed through</span>
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', margin: '4px 0' }} />
            <div className="flex items-center gap-2" style={{ fontSize: '11px' }}>
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: '18px', height: '18px', background: '#EBF6F3', color: '#0D3D32', fontSize: '9px', flexShrink: 0 }}
              >
                M
              </span>
              <span style={{ fontWeight: 500, color: '#0D3D32' }}>
                I receive the full sale price
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
          className="cursor-pointer rounded-xl p-4"
          style={isSelected('blended') ? TILE_SELECTED : TILE_UNSELECTED}
        >
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I pay different amounts for debit vs credit cards
          </p>
          <TechTag>blended · tiered rates</TechTag>

          <div
            className="mt-3 rounded-lg p-3"
            style={{ background: 'var(--color-background-secondary)' }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Debit card transactions</span>
              <MockBar width={36} />
            </div>
            <div className="mt-1 flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              <span>Credit card transactions</span>
              <MockBar width={52} />
            </div>
            <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', margin: '6px 0' }} />
            <div className="flex items-center justify-between" style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              <span>Total charged</span>
              <MockBar width={60} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Strategic rate tile (full-width, compact) ──────────── */}
      <div
        role="radio"
        aria-checked={strategicSelected}
        aria-label="I'm on a custom rate I negotiated for my business"
        tabIndex={0}
        onClick={handleStrategicSelect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStrategicSelect(); } }}
        className="mt-3 flex cursor-pointer items-center justify-between rounded-xl px-4 py-3"
        style={strategicSelected ? TILE_SELECTED : TILE_UNSELECTED}
      >
        <div>
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I&apos;m on a custom rate I negotiated for my business
          </p>
          <p className="text-caption italic" style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            A rate agreement specific to my business — not a standard published plan
          </p>
          <p
            className="font-mono"
            style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px', letterSpacing: '0.3px' }}
          >
            strategic · custom pricing · bespoke
          </p>
        </div>
        <span
          className="ml-4 flex-shrink-0 text-caption"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Large volume · individually negotiated
        </span>
      </div>

      {/* ── Don't know tile (dashed escape hatch) ──────────────── */}
      <div
        role="radio"
        aria-checked={isDontKnowSelected}
        aria-label="I'm not sure how I pay for card acceptance"
        tabIndex={0}
        onClick={handleDontKnow}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDontKnow(); } }}
        className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3"
        style={{
          ...(isDontKnowSelected ? TILE_SELECTED : TILE_UNSELECTED),
          borderStyle: isDontKnowSelected ? 'solid' : 'dashed',
        }}
      >
        <span
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: '28px',
            height: '28px',
            background: isDontKnowSelected ? '#1A6B5A' : 'var(--color-background-secondary)',
            color: isDontKnowSelected ? '#fff' : 'var(--color-text-tertiary)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          ?
        </span>
        <div>
          <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I&apos;m not sure how I pay for card acceptance
          </p>
          <p className="text-caption" style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            We&apos;ll use smart defaults and flag every assumption clearly on your results
          </p>
        </div>
      </div>

      {/* ── Zero-cost msfRateMode sub-panel (UNCHANGED logic) ── */}
      {planType === 'zero_cost' && !isUnknown && (
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

      {/* ── Blended optional rate panel (UNCHANGED logic) ──── */}
      {planType === 'blended' && !isUnknown && (
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

      {/* ── Hairline divider ───────────────────────────────────── */}
      <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: '24px', marginBottom: '20px' }} />

      {/* ── PSP selector (BELOW tiles) ─────────────────────────── */}
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '10px',
        }}
      >
        Who processes your payments?
      </p>
      <div
        role="radiogroup"
        aria-label="Payment processor"
        className="flex flex-wrap gap-2"
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

      {/* ── Flat-rate MSF pre-fill (SPRINT_BRIEF.md Sprint 2 UX-06) ──────
          Shown only for flat plans once the merchant picks a PSP. The rate
          is pre-filled from PSP_PUBLISHED_RATES — the merchant confirms or
          edits. Editing switches the source badge to "Your input" and locks
          out subsequent PSP-driven overwrites (handled in parent state). */}
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

      {/* ── Expert panel + Card mix (at bottom, before nav) ──── */}
      <ExpertPanel
        expertRates={merchantInput.expertRates}
        onChange={(rates) => onMerchantInputChange({ ...merchantInput, expertRates: rates })}
      />

      <CardMixInput
        value={merchantInput.cardMix ?? {}}
        onChange={(mix: CardMixInputType) =>
          onMerchantInputChange({ ...merchantInput, cardMix: mix })
        }
      />

      <div className="mt-8 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={handleNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}
