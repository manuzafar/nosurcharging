'use client';

import { useCallback, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface MobileBottomBarProps {
  category: 1 | 2 | 3 | 4;
}

const CTA_PRICE: Record<1 | 2 | 3 | 4, string> = {
  1: '$2,500',
  2: '$2,500',
  3: '$3,500',
  4: '$3,500',
};

export function MobileBottomBar({ category }: MobileBottomBarProps) {
  const [saved, setSaved] = useState(false);
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';
  const price = CTA_PRICE[category];

  const handleSave = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, []);

  const handleCTA = () => {
    trackEvent('CTA clicked', { category: String(category), source: 'mobile_bottom_bar' });
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 border-t border-rule bg-paper-white"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 10px), 12px)' }}
    >
      {/* Primary CTA */}
      <a
        href={calendlyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCTA}
        className="flex-1 text-center font-medium transition-opacity duration-150 hover:opacity-90 rounded-pill"
        style={{
          background: 'var(--color-accent)',
          color: '#FFFFFF',
          fontSize: '13px',
          padding: '10px 16px',
        }}
      >
        Book a call · {price}
      </a>

      {/* Secondary */}
      <button
        type="button"
        onClick={handleSave}
        className="shrink-0 text-caption font-medium cursor-pointer rounded-pill"
        style={{
          color: 'var(--color-text-secondary)',
          background: 'none',
          border: '1px solid var(--color-border-secondary)',
          padding: '10px 16px',
        }}
      >
        {saved ? 'Copied' : 'Save result'}
      </button>
    </div>
  );
}
