'use client';

// PSP Rate Registry — anonymous 3-field contribution form.
// PSP name and plan type pre-populated from assessment, read-only.
// Phase 1: trust_score=1, quarantined=false.

import { useRef, useState } from 'react';
import { contributeRate } from '@/actions/contributeRate';
import { Analytics } from '@/lib/analytics';

interface PSPRateRegistryProps {
  assessmentId: string;
  pspName: string;
  planType: 'flat' | 'costplus';
  volume: number;
  industry?: string;
  category?: 1 | 2 | 3 | 4 | 5;
  volumeTier?: string;
  onContributed?: () => void;
}

function getVolumeBand(volume: number): '0-100k' | '100k-1m' | '1m-10m' | '10m-50m' | '50m+' {
  if (volume < 100_000) return '0-100k';
  if (volume < 1_000_000) return '100k-1m';
  if (volume < 10_000_000) return '1m-10m';
  if (volume < 50_000_000) return '10m-50m';
  return '50m+';
}

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

export function PSPRateRegistry({
  assessmentId,
  pspName,
  planType,
  volume,
  industry,
  category,
  volumeTier,
  onContributed,
}: PSPRateRegistryProps) {
  const [rate, setRate] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [state, setState] = useState<'default' | 'loading' | 'success' | 'error'>('default');
  const formStartedTracked = useRef(false);

  // Fire registry_form_started on first user interaction with any field.
  const trackFormStarted = () => {
    if (formStartedTracked.current) return;
    formStartedTracked.current = true;
    Analytics.registryFormStarted({
      category: category ?? 0,
      psp: pspName,
    });
  };

  if (state === 'success') {
    return (
      <p className="text-body-sm" style={{ color: 'var(--color-text-success)' }}>
        Submitted. Thank you.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed <= 0 || parsed > 10) return;

    setState('loading');

    const result = await contributeRate({
      assessmentId,
      pspName,
      planType,
      effectiveRatePct: parsed,
      volumeBand: getVolumeBand(volume),
      industry: industry || undefined,
      stateCode: stateCode || undefined,
    });

    if (result.success) {
      setState('success');
      Analytics.registryContributed({
        psp: pspName,
        plan_type: planType,
        volume_tier: volumeTier ?? 'unknown',
        industry: industry ?? 'unknown',
      });
      onContributed?.();
    } else {
      setState('error');
    }
  };

  return (
    <div>
      <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        Help other merchants benchmark — takes 20 seconds.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        {/* PSP name — read-only */}
        <div className="flex items-center gap-3">
          <span className="text-caption w-24 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            PSP
          </span>
          <input
            type="text"
            value={pspName}
            readOnly
            className="flex-1 rounded-lg px-3 py-1.5 text-body-sm font-mono opacity-60"
            style={{ border: '0.5px solid var(--color-border-tertiary)' }}
          />
        </div>

        {/* Plan type — read-only */}
        <div className="flex items-center gap-3">
          <span className="text-caption w-24 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            Plan type
          </span>
          <input
            type="text"
            value={planType === 'flat' ? 'Flat rate' : 'Cost-plus'}
            readOnly
            className="flex-1 rounded-lg px-3 py-1.5 text-body-sm font-mono opacity-60"
            style={{ border: '0.5px solid var(--color-border-tertiary)' }}
          />
        </div>

        {/* Effective rate — user input */}
        <div className="flex items-center gap-3">
          <span className="text-caption w-24 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            Your rate %
          </span>
          <div className="relative flex-1">
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="1.40"
              value={rate}
              onChange={(e) => {
                trackFormStarted();
                setRate(e.target.value);
              }}
              className="w-full rounded-lg px-3 py-1.5 text-body-sm font-mono outline-none pr-7"
              style={{ border: '0.5px solid var(--color-border-secondary)' }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-body-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              %
            </span>
          </div>
        </div>

        {/* State — optional */}
        <div className="flex items-center gap-3">
          <span className="text-caption w-24 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
            State
          </span>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            className="flex-1 rounded-lg px-3 py-1.5 text-body-sm outline-none"
            style={{ border: '0.5px solid var(--color-border-secondary)', background: '#FFFFFF' }}
          >
            <option value="">Optional</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={state === 'loading' || !rate}
          className="rounded-lg px-4 py-2 text-body-sm font-medium
            disabled:opacity-40 transition-opacity duration-150"
          style={{
            border: '0.5px solid var(--color-border-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          {state === 'loading' ? 'Submitting...' : 'Submit anonymously →'}
        </button>
      </form>

      <p className="mt-2 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
        Anonymous. Never shared with {pspName}.
      </p>

      {state === 'error' && (
        <p className="mt-1 text-caption" style={{ color: 'var(--color-text-danger)' }}>
          Could not submit. You may have already contributed for this assessment.
        </p>
      )}
    </div>
  );
}
