'use client';

// Single client island for the otherwise-SSR homepage tree (see page.tsx
// header comment — homepage components stay server-only). Two responsibilities:
//   1. Fire homepage_viewed once on mount with referrer + UTM params.
//   2. Delegate clicks via [data-cta] so CTAs in nav/hero/bottom can stay
//      server-rendered. Each CTA carries data-cta="nav" | "hero" | "bottom".

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Analytics } from '@/lib/analytics';

type HomepageCta = 'nav' | 'hero' | 'bottom';
const VALID_CTAS: ReadonlySet<HomepageCta> = new Set(['nav', 'hero', 'bottom']);

export function HomepageAnalytics() {
  const searchParams = useSearchParams();

  // 1. Page view — fires once per mount.
  useEffect(() => {
    Analytics.homepageViewed({
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      is_mobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. CTA click delegation.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cta]');
      const cta = el?.dataset.cta;
      if (cta && VALID_CTAS.has(cta as HomepageCta)) {
        Analytics.homepageCtaClicked(cta as HomepageCta);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}
