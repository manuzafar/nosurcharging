'use client';

// ConsultingCTA — per ux-spec §3.10.
// Single Reform Ready engagement offer. Ink background, accent button.
// PSP name interpolated into the headline. No category-specific rewrites
// — single voice, single price, single conversion goal.
//
// Banned: "your PSP" / "your provider". Use: explicit pspName.

import { trackEvent } from '@/lib/analytics';

interface ConsultingCTAProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}

export function ConsultingCTA({ category, pspName }: ConsultingCTAProps) {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

  const handleClick = () => {
    trackEvent('CTA clicked', { category: String(category) });
  };

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      style={{
        background: '#1A1409',
        padding: '24px',
      }}
    >
      {/* Left — headline + sub */}
      <div className="sm:flex-1 sm:pr-4">
        <h3
          className="font-serif font-medium"
          style={{
            fontSize: '17px',
            color: '#FFFFFF',
            lineHeight: 1.45,
          }}
        >
          Walk into October knowing exactly what to say to {pspName}, what to
          charge customers, and whether your rate is fair.
        </h3>
        <p
          className="mt-2"
          style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.32)',
            lineHeight: 1.5,
          }}
        >
          Reform Ready · one engagement · fixed price · April–September 2026
        </p>
      </div>

      {/* Right — button + price note */}
      <div className="flex flex-col items-stretch sm:items-center sm:shrink-0">
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="font-medium text-center transition-opacity duration-150 hover:opacity-90"
          style={{
            background: '#1A6B5A',
            color: '#FFFFFF',
            fontSize: '12px',
            padding: '11px 18px',
          }}
        >
          Book discovery call →
        </a>
        <p
          className="text-center"
          style={{
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.18)',
            marginTop: '5px',
          }}
        >
          $3,500 · Reform Ready
        </p>
      </div>
    </div>
  );
}
