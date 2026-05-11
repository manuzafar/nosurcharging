'use client';

// Step 3 — surcharging status, redesigned per ASSESSMENT_STEP3_REDESIGN_BRIEF.md.
// Editorial pattern: Yes/No cards with leading Lucide icons, single white
// conditional container holding the (unchanged) network checkboxes,
// chip-augmented rate input matching Step 1's vocabulary, and an
// always-on regulatory info note. Network checkbox structure LOCKED.
//
// Cat 5 (zero_cost) variant — when mode='zero_cost':
//   Visa/MC/eftpos are pre-set in surchargeNetworks by the parent.
//   Step 3 renders a simplified Amex-only question. Same Yes/No icon
//   vocabulary + chip-augmented rate as standard mode.

import { useState } from 'react';
import { Percent, EqualNot, Info } from 'lucide-react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';

interface Step3SurchargingProps {
  mode?: 'standard' | 'zero_cost';
  surcharging: boolean | null;
  surchargeRate: number;
  surchargeNetworks: string[];
  onSurchargingChange: (surcharging: boolean) => void;
  onSurchargeRateChange: (rate: number) => void;
  onNetworksChange: (networks: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const RATE_CHIPS = [1.0, 1.5, 2.0, 2.5] as const;
const DEFAULT_SURCHARGE_RATE = 0.02;
const ALL_NETWORKS = ['visa', 'eftpos', 'amex', 'bnpl'];

// ── Chip-augmented rate input ────────────────────────────────────
// Reused by both standard and zero-cost variants. Mirrors Step 1's
// chip vocabulary: white default / emerald-light active.
function RateInputWithChips({
  rateInput,
  onChange,
  label,
  ariaLabel,
}: {
  rateInput: string;
  onChange: (raw: string) => void;
  label: string;
  ariaLabel: string;
}) {
  const currentPct = parseFloat(rateInput);
  return (
    <div>
      <label
        className="font-medium block"
        style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
      >
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="2.0"
            value={rateInput}
            onChange={(e) => onChange(e.target.value)}
            aria-label={ariaLabel}
            className="font-mono outline-none transition-colors duration-150 focus:border-accent"
            style={{
              width: '90px',
              padding: '8px 14px',
              fontSize: '18px',
              fontWeight: 500,
              borderRadius: '8px',
              border: '1px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <span
            className="font-mono"
            style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}
          >
            %
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
          {RATE_CHIPS.map((pct) => {
            const active = !isNaN(currentPct) && Math.abs(currentPct - pct) < 0.01;
            return (
              <button
                key={pct}
                type="button"
                onClick={() => onChange(pct.toFixed(1))}
                className="font-mono cursor-pointer transition-all duration-100"
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: active
                    ? '1px solid #1A6B5A'
                    : '0.5px solid var(--color-border-secondary)',
                  background: active ? '#EBF6F3' : 'var(--color-background-primary)',
                  color: active ? '#0D3D32' : 'var(--color-text-secondary)',
                }}
              >
                {pct.toFixed(1)}%
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Yes / No card pair (shared between modes) ────────────────────
// Equal-height cards with leading Lucide icons. No priority signal —
// the merchant chooses consciously. Yes selected = amber, No = emerald.
function YesNoCards({
  surcharging,
  onYes,
  onNo,
  yesSubLabel,
  noSubLabel,
}: {
  surcharging: boolean | null;
  onYes: () => void;
  onNo: () => void;
  yesSubLabel: string;
  noSubLabel: string;
}) {
  const yesSelected = surcharging === true;
  const noSelected = surcharging === false;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={onYes}
        aria-pressed={yesSelected}
        className="cursor-pointer rounded-xl p-5 text-left transition-all duration-150"
        style={{
          minHeight: '130px',
          border: yesSelected
            ? '1.5px solid #BA7517'
            : '1px solid var(--color-border-tertiary)',
          background: yesSelected ? '#FAEEDA' : 'var(--color-background-primary)',
        }}
      >
        <Percent
          size={20}
          strokeWidth={1.6}
          color={yesSelected ? '#BA7517' : 'var(--color-text-tertiary)'}
          aria-hidden
        />
        <p
          className="mt-1 font-serif"
          style={{
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.2,
            color: yesSelected ? '#633806' : 'var(--color-text-primary)',
          }}
        >
          Yes
        </p>
        <p
          className="mt-1"
          style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}
        >
          {yesSubLabel}
        </p>
      </button>

      <button
        type="button"
        onClick={onNo}
        aria-pressed={noSelected}
        className="cursor-pointer rounded-xl p-5 text-left transition-all duration-150"
        style={{
          minHeight: '130px',
          border: noSelected
            ? '1.5px solid #1A6B5A'
            : '1px solid var(--color-border-tertiary)',
          background: noSelected ? '#EBF6F3' : 'var(--color-background-primary)',
        }}
      >
        <EqualNot
          size={20}
          strokeWidth={1.6}
          color={noSelected ? '#1A6B5A' : 'var(--color-text-tertiary)'}
          aria-hidden
        />
        <p
          className="mt-1 font-serif"
          style={{
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.2,
            color: noSelected ? '#0D3D32' : 'var(--color-text-primary)',
          }}
        >
          No
        </p>
        <p
          className="mt-1"
          style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}
        >
          {noSubLabel}
        </p>
      </button>
    </div>
  );
}

// ── Regulatory info note (always-on under Yes path) ──────────────
function RegulatoryNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg"
      style={{
        background: 'var(--color-background-secondary)',
        padding: '12px 14px',
      }}
    >
      <Info
        size={16}
        strokeWidth={1.6}
        color="var(--color-text-secondary)"
        aria-hidden
        className="mt-0.5 flex-shrink-0"
      />
      <p style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
        {children}
      </p>
    </div>
  );
}

export function Step3Surcharging({
  mode = 'standard',
  surcharging,
  surchargeRate,
  surchargeNetworks,
  onSurchargingChange,
  onSurchargeRateChange,
  onNetworksChange,
  onNext,
  onBack,
}: Step3SurchargingProps) {
  // Hooks must precede any early return (Rules of Hooks).
  const [rateInput, setRateInput] = useState(surchargeRate > 0 ? String(surchargeRate * 100) : '');

  if (mode === 'zero_cost') {
    return (
      <ZeroCostStep3
        surcharging={surcharging}
        surchargeRate={surchargeRate}
        surchargeNetworks={surchargeNetworks}
        onSurchargingChange={onSurchargingChange}
        onSurchargeRateChange={onSurchargeRateChange}
        onNetworksChange={onNetworksChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }

  const handleRateChange = (raw: string) => {
    setRateInput(raw);
    const parsed = parseFloat(raw);
    onSurchargeRateChange(isNaN(parsed) ? 0 : parsed / 100);
  };

  const toggleNetwork = (network: string) => {
    const updated = surchargeNetworks.includes(network)
      ? surchargeNetworks.filter((n) => n !== network)
      : [...surchargeNetworks, network];
    onNetworksChange(updated);
  };

  const handleYes = () => {
    // Prefill only when transitioning from null/false → true. Re-clicking
    // Yes or returning to the step from a later step preserves state.
    if (surcharging !== true) {
      if (surchargeNetworks.length === 0) {
        onNetworksChange(ALL_NETWORKS);
      }
      if (surchargeRate === 0) {
        onSurchargeRateChange(DEFAULT_SURCHARGE_RATE);
        setRateInput(String(DEFAULT_SURCHARGE_RATE * 100));
      }
    }
    onSurchargingChange(true);
  };

  const handleNo = () => {
    onSurchargingChange(false);
    onSurchargeRateChange(0);
    onNetworksChange([]);
    setRateInput('');
  };

  const canProceed =
    surcharging === false || (surcharging === true && surchargeRate > 0);

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 3</p>
      <h2
        className="mt-2 font-serif text-ink"
        style={{ fontSize: '30px', lineHeight: '1.2', letterSpacing: '-0.3px', fontWeight: 500 }}
      >
        Do you currently surcharge card payments?
      </h2>
      <p
        className="mt-2"
        style={{ fontSize: '14px', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}
      >
        Adding a fee on top of the purchase price for card payments.
      </p>

      <div className="mt-6">
        <YesNoCards
          surcharging={surcharging}
          onYes={handleYes}
          onNo={handleNo}
          yesSubLabel="I add a surcharge on card payments"
          noSubLabel="My customers pay the listed price"
        />
      </div>

      {/* Conditional container — single white card wrapping networks +
          rate + regulatory note. Renders only when Yes is selected. */}
      {surcharging === true && (
        <div
          className="mt-4 rounded-xl"
          style={{
            border: '1px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            padding: '20px',
          }}
        >
          {/* Network checkboxes — LOCKED structure per brief */}
          <p
            className="font-medium"
            style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}
          >
            Which networks do you surcharge?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { id: 'visa', label: 'Visa & Mastercard' },
              { id: 'eftpos', label: 'eftpos' },
              { id: 'amex', label: 'Amex', note: 'still permitted' },
              { id: 'bnpl', label: 'BNPL / PayPal', note: 'still permitted' },
            ].map((network) => (
              <label
                key={network.id}
                className="flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={surchargeNetworks.includes(network.id)}
                  onChange={() => toggleNetwork(network.id)}
                  className="mt-0.5 h-4 w-4 rounded accent-accent"
                />
                <span className="text-body-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {network.label}
                  {network.note && (
                    <span
                      className="ml-1 italic"
                      style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}
                    >
                      ({network.note})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5">
            <RateInputWithChips
              rateInput={rateInput}
              onChange={handleRateChange}
              label="What surcharge rate do you charge?"
              ariaLabel="Surcharge rate percentage"
            />
          </div>

          <div className="mt-5">
            <RegulatoryNote>
              From 1 October 2026, surcharging Visa, Mastercard, and eftpos becomes
              illegal. Amex, BNPL, and PayPal remain surchargeable — if you only
              surcharge those, the reform may not directly affect your revenue.
            </RegulatoryNote>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}

// ── Zero-cost variant ─────────────────────────────────────────────
// Cat 5 path. Visa/MC/eftpos pre-set by parent. Single Amex-only
// question. Same Yes/No vocabulary + chip-augmented rate as standard.

interface ZeroCostStep3Props {
  surcharging: boolean | null;
  surchargeRate: number;
  surchargeNetworks: string[];
  onSurchargingChange: (surcharging: boolean) => void;
  onSurchargeRateChange: (rate: number) => void;
  onNetworksChange: (networks: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function ZeroCostStep3({
  surcharging,
  surchargeRate,
  surchargeNetworks,
  onSurchargingChange,
  onSurchargeRateChange,
  onNetworksChange,
  onNext,
  onBack,
}: ZeroCostStep3Props) {
  const [rateInput, setRateInput] = useState(surchargeRate > 0 ? String(surchargeRate * 100) : '');

  const handleRateChange = (raw: string) => {
    setRateInput(raw);
    const parsed = parseFloat(raw);
    onSurchargeRateChange(isNaN(parsed) ? 0 : parsed / 100);
  };

  const handleYes = () => {
    onSurchargingChange(true);
    if (!surchargeNetworks.includes('amex')) {
      onNetworksChange([...surchargeNetworks, 'amex']);
    }
  };

  const handleNo = () => {
    onSurchargingChange(false);
    onSurchargeRateChange(0);
    onNetworksChange(surchargeNetworks.filter((n) => n !== 'amex'));
    setRateInput('');
  };

  const canProceed =
    surcharging === false || (surcharging === true && surchargeRate > 0);

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 3</p>
      <h2
        className="mt-2 font-serif text-ink"
        style={{ fontSize: '30px', lineHeight: '1.2', letterSpacing: '-0.3px', fontWeight: 500 }}
      >
        One last question about Amex
      </h2>
      <p
        className="mt-2"
        style={{ fontSize: '14px', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}
      >
        Your zero-cost plan handles Visa, Mastercard, and eftpos automatically. Amex
        isn&apos;t covered by the October ban.
      </p>

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
        Does your terminal separately surcharge Amex card payments?
      </p>

      <YesNoCards
        surcharging={surcharging}
        onYes={handleYes}
        onNo={handleNo}
        yesSubLabel="Amex transactions carry a separate surcharge"
        noSubLabel="Amex is on the same plan as the other cards"
      />

      {surcharging === true && (
        <div
          className="mt-4 rounded-xl"
          style={{
            border: '1px solid var(--color-border-tertiary)',
            background: 'var(--color-background-primary)',
            padding: '20px',
          }}
        >
          <RateInputWithChips
            rateInput={rateInput}
            onChange={handleRateChange}
            label="What Amex surcharge rate do you charge?"
            ariaLabel="Amex surcharge rate percentage"
          />
        </div>
      )}

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!canProceed}>
          Next
        </AccentButton>
      </div>
    </div>
  );
}
