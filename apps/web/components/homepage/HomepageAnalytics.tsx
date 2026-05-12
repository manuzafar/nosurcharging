'use client';

// Single client island for the otherwise-SSR homepage tree (see page.tsx
// header comment — homepage components stay server-only). Two responsibilities:
//   1. Fire homepage_viewed once on mount with referrer + UTM params.
//   2. Delegate clicks via [data-cta] so CTAs in nav/hero/bottom can stay
//      server-rendered. Each CTA carries data-cta="nav" | "hero" | "bottom".

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { Analytics } from '@/lib/analytics';

type HomepageCta = 'nav' | 'hero' | 'bottom';
const VALID_CTAS: ReadonlySet<HomepageCta> = new Set(['nav', 'hero', 'bottom']);

export function HomepageAnalytics() {
  const searchParams = useSearchParams();

  // 1. Page view — fires once per mount.
  useEffect(() => {
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const referrer =
      typeof document !== 'undefined' ? document.referrer : '';

    // METRICS_DASHBOARD_BRIEF §1.5 — register UTM attribution as
    // PostHog super-properties so every subsequent event in the
    // session (assessment_started, results_viewed, email_captured)
    // automatically carries initial_utm_* without each event having
    // to plumb the values through manually. Only register when at
    // least one UTM param is present so direct visitors don't get
    // empty super-properties polluting their event payloads.
    if (utmSource || utmMedium || utmCampaign) {
      posthog.register({
        initial_utm_source: utmSource ?? '',
        initial_utm_medium: utmMedium ?? '',
        initial_utm_campaign: utmCampaign ?? '',
        initial_referrer: referrer || 'direct',
      });
    }

    Analytics.homepageViewed({
      referrer,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
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
