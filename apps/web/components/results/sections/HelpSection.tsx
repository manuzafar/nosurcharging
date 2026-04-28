'use client';

import { forwardRef } from 'react';
import { ConsultingCTA } from '@/components/results/ConsultingCTA';
import { EmailCapture } from '@/components/results/EmailCapture';
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
    const { category, pspName, assessmentId, plSwing, volumeTier } = props;

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

        <div className="mt-6">
          <EmailCapture
            assessmentId={assessmentId}
            captureMoment="help_section"
            category={category}
            plSwing={plSwing}
            volumeTier={volumeTier}
            psp={pspName}
          />
        </div>

        <div className="mt-8 mb-4">
          <ResultsDisclaimer />
        </div>
      </section>
    );
  },
);
