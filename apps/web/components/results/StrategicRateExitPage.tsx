'use client';

// Strategic rate exit page — shown when result.strategicRateExit is true.
// No dollar figures anywhere. Three mechanism cards + back button.
// On mount: trackEvent('Strategic rate exit viewed', ...).

import { useEffect } from 'react';
import { Analytics } from '@/lib/analytics';

interface StrategicRateExitPageProps {
  onBack: () => void;
}

export function StrategicRateExitPage({ onBack }: StrategicRateExitPageProps) {
  useEffect(() => {
    Analytics.strategicRateExitViewed({ trigger: 'result_page' });
  }, []);

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-results px-5 py-12">
        <div className="text-center">
          <p
            className="text-label font-medium"
            style={{ color: 'var(--color-text-tertiary)', letterSpacing: '1.5px' }}
          >
            STRATEGIC RATE
          </p>
          <h2
            className="mt-4 font-serif font-medium"
            style={{ fontSize: '22px', color: 'var(--color-text-primary)' }}
          >
            Your pricing falls outside standard category analysis
          </h2>
          <p className="mt-3 text-body" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}>
            Merchants with individually negotiated interchange rates require specialist
            review. The standard assessment cannot accurately model your position.
          </p>
        </div>

        {/* Three mechanism cards */}
        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="rounded-lg border border-gray-200 p-5">
            <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Interchange review
            </p>
            <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
              Your negotiated rates may already be below the new regulated caps.
              A line-by-line review of your interchange schedule will determine
              whether additional savings materialise from the reform.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Scheme fee analysis
            </p>
            <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
              Scheme fees are unregulated and unchanged by the reform. At your volume,
              scheme fee optimisation may deliver greater savings than interchange
              reductions.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-5">
            <p className="text-body font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Surcharge strategy
            </p>
            <p className="mt-2 text-body-sm" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
              The designated-network surcharge ban applies regardless of volume.
              If you currently surcharge Visa, Mastercard, or eftpos, you need
              a repricing strategy before 1 October.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-6 py-2 text-body-sm text-gray-600
              hover:border-gray-300 transition-colors duration-150"
          >
            Back to assessment
          </button>
        </div>
      </div>
    </main>
  );
}
