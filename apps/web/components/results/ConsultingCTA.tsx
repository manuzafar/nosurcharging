'use client';

// ConsultingCTA — category-specific headline, body, and pricing.
// Cat 1-2: $2,500 Payments Health Check
// Cat 3-4: $3,500 Reform Ready
// PSP name interpolated into the headline. No "your PSP".

import { Analytics } from '@/lib/analytics';

interface ConsultingCTAProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  plSwing?: number;
  volumeTier?: string;
}

const CTA_CONFIG: Record<
  1 | 2 | 3 | 4 | 5,
  { eyebrow: string; title: string; price: string; priceNum: number }
> = {
  1: {
    eyebrow: 'Payments Health Check',
    title: 'Your plan is solid — let\u2019s confirm the saving arrives',
    price: '$2,500',
    priceNum: 2500,
  },
  2: {
    eyebrow: 'Payments Health Check',
    title: '{psp} needs to change your rate — let\u2019s get it in writing',
    price: '$2,500',
    priceNum: 2500,
  },
  3: {
    eyebrow: 'Reform Ready',
    title: 'Your repricing strategy needs to be set before October',
    price: '$3,500',
    priceNum: 3500,
  },
  4: {
    eyebrow: 'Reform Ready',
    title: 'Two problems, one October deadline — let\u2019s fix both',
    price: '$3,500',
    priceNum: 3500,
  },
  5: {
    eyebrow: 'Reform Ready',
    title: 'Your zero-cost plan ends — let\u2019s lock in your post-October rate',
    price: '$3,500',
    priceNum: 3500,
  },
};

export function ConsultingCTA({ category, pspName, plSwing, volumeTier }: ConsultingCTAProps) {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';
  const config = CTA_CONFIG[category];
  const title = config.title.replace('{psp}', pspName);

  const handleClick = () => {
    Analytics.ctaClicked({
      cta_type: 'consulting',
      cta_location: 'help_section',
      category,
      pl_swing: plSwing,
      volume_tier: volumeTier,
      psp: pspName,
    });
  };

  return (
    <div
      style={{
        background: '#1A1409',
        padding: '24px',
      }}
    >
      {/* Eyebrow */}
      <p
        className="uppercase font-medium"
        style={{
          fontSize: '11px',
          letterSpacing: '1.5px',
          color: 'rgba(255, 255, 255, 0.4)',
          marginBottom: '10px',
        }}
      >
        {config.eyebrow}
      </p>

      {/* Headline */}
      <h3
        className="font-serif font-medium"
        style={{
          fontSize: '17px',
          color: '#FFFFFF',
          lineHeight: 1.45,
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>

      {/* Bottom bar — CTA + detail */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="font-medium text-center transition-opacity duration-150 hover:opacity-90 rounded-pill"
          style={{
            background: '#1A6B5A',
            color: '#FFFFFF',
            fontSize: '13px',
            padding: '11px 20px',
          }}
        >
          Book a call · {config.price}
        </a>
        <p
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          30-minute call · Fixed price · No retainer
        </p>
      </div>
    </div>
  );
}
