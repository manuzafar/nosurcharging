'use client';

// App Router requires manual pageview capture — capture_pageview: false
// is set in initPostHog. This provider:
//   1. Initialises PostHog once on first mount.
//   2. Fires a $pageview on every route change (pathname + searchParams).
//
// Wraps children in the root layout. Must be inside a <Suspense> because
// useSearchParams is a Suspense-bound hook in App Router.

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, capturePageview } from '@/lib/analytics';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    capturePageview(window.location.href);
    // pathname/searchParams are the trigger; we read window.location.href
    // for the canonical URL including query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return <>{children}</>;
}
