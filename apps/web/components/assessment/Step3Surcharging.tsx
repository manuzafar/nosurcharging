'use client';

// Step 3: Surcharging.
// CB-04: Yes/No buttons (large, visual). Yes = warning, No = success.
// CB-05: Network checkboxes (2x2 grid). Amex/BNPL-only detection on every change.
// Surcharge rate input when Yes selected.
//
// Cat 5 (zero_cost) routing — when mode='zero_cost':
//   - Visa/Mastercard/eftpos are pre-set in surchargeNetworks by the parent
//     (PSP-mediated zero-cost surcharge always covers them).
//   - Step 3 renders a SIMPLIFIED Amex-only question.
//   - PayPal/BNPL options are not shown (irrelevant to terminal-based merchants).

import { useState } from 'react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';

const EXEMPT_NETWORKS = ['amex', 'bnpl'];

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

  // CB-05: Amex/BNPL-only detection — runs on every checkbox change
  const onlyExemptNetworks =
    surchargeNetworks.length > 0 &&
    surchargeNetworks.every((n) => EXEMPT_NETWORKS.includes(n));

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
      <h2 className="mt-2 font-serif text-heading-lg">
        Do you currently surcharge card payments?
      </h2>
      <p className="mt-2 text-body-sm text-gray-500">
        Adding a fee on top of the purchase price for card payments.
      </p>

      {/* CB-04: Yes/No buttons — semantic colours from CSS variables */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSurchargingChange(true)}
          className="rounded-lg p-5 text-left transition-all duration-150"
          style={
            surcharging === true
              ? {
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border-warning)',
                  background: 'var(--color-background-warning)',
                }
              : { borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--color-border-secondary)' }
          }
        >
          <span
            className="font-serif text-heading-md"
            style={{ color: surcharging === true ? 'var(--color-text-warning)' : undefined }}
          >
            Yes
          </span>
          <p className="mt-1 text-caption text-gray-500">
            I add a surcharge on some or all cards
          </p>
        </button>

        <button
          type="button"
          onClick={handleNo}
          className="rounded-lg p-5 text-left transition-all duration-150"
          style={
            surcharging === false
              ? {
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border-success)',
                  background: 'var(--color-background-success)',
                }
              : { borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--color-border-secondary)' }
          }
        >
          <span
            className="font-serif text-heading-md"
            style={{ color: surcharging === false ? 'var(--color-text-success)' : undefined }}
          >
            No
          </span>
          <p className="mt-1 text-caption text-gray-500">
            My customers pay the listed price
          </p>
        </button>
      </div>

      {/* Conditional: network checkboxes + surcharge rate.
          The wrapper uses overflow-hidden + max-h transition for the slide
          animation. The focus-visible ring on the rate input below extends
          ~4px outside the input edge (per the global :focus-visible rule
          in globals.css). overflow:hidden clips outlines at the parent's
          padding edge, so we reserve 8px on every side (p-2) to leave the
          ring with a comfortable 4px of clearance. Padding does not affect
          the max-h-0 collapsed state because box-sizing: border-box clamps
          the entire box to 0px. */}
      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${
          surcharging === true ? 'mt-4 max-h-[500px] opacity-100 p-2' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Network checkboxes (CB-05) */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-body-sm font-medium text-gray-700">
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
                <span className="text-body-sm text-gray-700">
                  {network.label}
                  {network.note && (
                    <span className="ml-1 text-caption text-gray-500">
                      ({network.note})
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* Amex/BNPL-only note — CB-05: 12px, semantic success colours */}
          {onlyExemptNetworks && (
            <div
              className="mt-3 rounded-lg p-3"
              style={{
                background: 'var(--color-background-success)',
                border: '0.5px solid var(--color-border-success)',
              }}
            >
              <p className="text-caption" style={{ color: 'var(--color-text-success)', fontSize: '12px' }}>
                The October ban doesn&apos;t cover Amex, BNPL or PayPal — these remain
                surchargeable. If you only surcharge these networks, this reform may
                not directly affect your surcharge revenue.
              </p>
            </div>
          )}
        </div>

        {/* Surcharge rate input */}
        <div className="mt-3">
          <label className="text-body-sm font-medium text-gray-700">
            What surcharge rate do you charge?
          </label>
          <div className="relative mt-1 max-w-[160px]">
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="1.5"
              value={rateInput}
              onChange={(e) => handleRateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2
                font-mono text-body-sm outline-none focus:border-accent
                transition-colors duration-150 pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-gray-500">
              %
            </span>
          </div>
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

// ── Zero-cost variant ─────────────────────────────────────────────
// Cat 5 path. Visa/Mastercard/eftpos pre-set in surchargeNetworks by
// parent. Single targeted question: separate Amex surcharge yes/no.
// PayPal/BNPL not shown — irrelevant for terminal-based zero-cost merchants.

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
      <h2 className="mt-2 font-serif text-heading-lg">
        One last question about Amex
      </h2>
      <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
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

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleYes}
          className="rounded-lg p-5 text-left transition-all duration-150"
          style={
            surcharging === true
              ? {
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border-warning)',
                  background: 'var(--color-background-warning)',
                }
              : { borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--color-border-secondary)' }
          }
        >
          <span
            className="font-serif text-heading-md"
            style={{ color: surcharging === true ? 'var(--color-text-warning)' : undefined }}
          >
            Yes
          </span>
          <p className="mt-1 text-caption text-gray-500">
            Amex transactions carry a separate surcharge
          </p>
        </button>

        <button
          type="button"
          onClick={handleNo}
          className="rounded-lg p-5 text-left transition-all duration-150"
          style={
            surcharging === false
              ? {
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border-success)',
                  background: 'var(--color-background-success)',
                }
              : { borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--color-border-secondary)' }
          }
        >
          <span
            className="font-serif text-heading-md"
            style={{ color: surcharging === false ? 'var(--color-text-success)' : undefined }}
          >
            No
          </span>
          <p className="mt-1 text-caption text-gray-500">
            Amex is on the same plan as the other cards
          </p>
        </button>
      </div>

      {/* Rate input — same focus-ring p-2 padding pattern as standard mode */}
      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${
          surcharging === true ? 'mt-4 max-h-[200px] opacity-100 p-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="text-body-sm font-medium text-gray-700">
            What Amex surcharge rate do you charge?
          </label>
          <div className="relative mt-2 max-w-[160px]">
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="1.5"
              value={rateInput}
              onChange={(e) => handleRateChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2
                font-mono text-body-sm outline-none focus:border-accent
                transition-colors duration-150 pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-gray-500">
              %
            </span>
          </div>
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
