'use client';

import { forwardRef } from 'react';
import { ConsultingCTA } from '@/components/results/ConsultingCTA';
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

        <ConsultingCTA
          category={category}
          pspName={pspName}
          plSwing={plSwing}
          volumeTier={volumeTier}
        />

        {/* Email contact fallback — replaces the old benchmark-mailing
            EmailCapture form. The merchant already provided their email at
            the pre-reveal gate, so we only surface a direct contact route
            here for ad-hoc questions. */}
        <p
          className="mt-4 text-caption"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Or email us:{' '}
          <a
            href="mailto:hello@nosurcharging.com.au"
            className="underline"
            style={{ color: 'var(--color-text-primary)' }}
          >
            hello@nosurcharging.com.au
          </a>
        </p>

        <div className="mt-8 mb-4">
          <ResultsDisclaimer />
        </div>
      </section>
    );
  },
);
