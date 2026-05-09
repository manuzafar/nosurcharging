'use client';

import { forwardRef } from 'react';
import { ReformReadyUpsell } from '@/components/results/ReformReadyUpsell';
import { ResultsDisclaimer } from '@/components/results/ResultsDisclaimer';

interface HelpSectionProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  assessmentId: string;
  plSwing?: number;
  volumeTier?: string;
}

export const HelpSection = forwardRef<HTMLElement, HelpSectionProps>(
  function HelpSection(props, ref) {
    // assessmentId is retained on the props interface for back-compat with
    // upstream callers; not used after EmailCapture removal.
    const { category, pspName, plSwing, volumeTier } = props;

    return (
      <section id="help" data-section="help" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Next steps
        </p>

        {/* Email contact fallback + disclaimer sit ABOVE the upsell so the
            merchant has a free contact route before the paid ask. */}
        <p
          className="text-caption mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Got a quick question? Email{' '}
          <a
            href="mailto:hello@nosurcharging.com.au"
            className="underline"
            style={{ color: 'var(--color-text-primary)' }}
          >
            hello@nosurcharging.com.au
          </a>
          .
        </p>

        <ReformReadyUpsell
          category={category}
          pspName={pspName}
          plSwing={plSwing}
          volumeTier={volumeTier}
        />

        <div className="mt-8 mb-4">
          <ResultsDisclaimer />
        </div>
      </section>
    );
  },
);
