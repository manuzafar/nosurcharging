'use client';

// CB-12: Consulting CTA — category-specific copy, varies before/after Oct 2026.
// Opens Calendly in new tab. Plausible event on click.
// Copy from docs/product/consulting-products.md "Results Page CTA Hierarchy".

import { getCurrentPeriod } from '@nosurcharging/calculations/periods';
import { trackEvent } from '@/lib/analytics';

interface ConsultingCTAProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}

function getCTACopy(category: 1 | 2 | 3 | 4, pspName: string, isPreReform: boolean): string {
  if (category === 1) {
    return `Verified your rate is below market? A Payments Health Check confirms it — and finds any hidden fees you're paying above your contracted rate. $2,500.`;
  }
  if (category === 2) {
    return `Want someone to negotiate with ${pspName} on your behalf? A Payments Health Check reviews your statements, benchmarks your rate, and gives you the exact script. $2,500.`;
  }
  // Cat 3 and 4
  if (isPreReform) {
    return `You need to act before October. A Reform Ready engagement calculates your exact repricing gap, gives you the PSP script, and follows up when the benchmark data drops. $3,500. Limited availability.`;
  }
  return `The reform is live. A Payments Health Check will tell you whether your costs actually fell — and what to do if they didn't. $2,500.`;
}

export function ConsultingCTA({ category, pspName }: ConsultingCTAProps) {
  const period = getCurrentPeriod();
  const isPreReform = period === 'pre_reform';
  const copy = getCTACopy(category, pspName, isPreReform);
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

  const handleClick = () => {
    trackEvent('CTA clicked', { category: String(category) });
  };

  return (
    <div
      className="rounded-xl p-7"
      style={{ background: 'var(--color-background-secondary)' }}
    >
      <h3
        className="font-serif font-medium"
        style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
      >
        Get expert help with your payments
      </h3>

      <p
        className="mt-3 text-body-sm"
        style={{
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          maxWidth: '400px',
        }}
      >
        {copy}
      </p>

      <a
        href={calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="mt-4 inline-block rounded-lg px-7 py-3 text-body-sm font-medium
          transition-opacity duration-150 hover:opacity-90"
        style={{ background: '#BA7517', color: '#FAEEDA' }}
      >
        Book a free discovery call
      </a>

      <p className="mt-3 text-caption" style={{ color: 'var(--color-text-secondary)' }}>
        Manu · Payments practitioner · Paid It
      </p>
    </div>
  );
}
