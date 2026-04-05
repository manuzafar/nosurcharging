'use client';

// Step 3: Surcharging.
// CB-04: Yes/No buttons (large, visual). Yes = warning, No = success.
// CB-05: Network checkboxes (2x2 grid). Amex/BNPL-only detection on every change.
// Surcharge rate input when Yes selected.

import { useState, useEffect } from 'react';
import { AmberButton } from '@/components/ui/AmberButton';
import { TextButton } from '@/components/ui/TextButton';

const EXEMPT_NETWORKS = ['amex', 'bnpl'];

interface Step3SurchargingProps {
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
  surcharging,
  surchargeRate,
  surchargeNetworks,
  onSurchargingChange,
  onSurchargeRateChange,
  onNetworksChange,
  onNext,
  onBack,
}: Step3SurchargingProps) {
  const [rateInput, setRateInput] = useState(surchargeRate > 0 ? String(surchargeRate * 100) : '');

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
      <p className="text-label tracking-widest text-amber-400">Step 3</p>
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
          className="rounded-xl p-5 text-left transition-all duration-150"
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
          className="rounded-xl p-5 text-left transition-all duration-150"
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

      {/* Conditional: network checkboxes + surcharge rate */}
      <div
        className={`overflow-hidden transition-all duration-250 ease-out ${
          surcharging === true ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
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
                  className="mt-0.5 h-4 w-4 rounded accent-amber-400"
                />
                <span className="text-body-sm text-gray-700">
                  {network.label}
                  {network.note && (
                    <span className="ml-1 text-caption text-gray-400">
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
                font-mono text-body-sm outline-none focus:border-amber-400
                transition-colors duration-150 pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm text-gray-400">
              %
            </span>
          </div>
        </div>
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
