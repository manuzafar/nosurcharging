'use client';

// TrackedSection — fires Analytics.sectionVisited once per session
// per `sectionId` when the wrapped block enters the viewport. The
// engagement-after-verdict signal that powers the "qualified
// completions" North Star metric (METRICS_DASHBOARD_BRIEF §4.1).
//
// Threshold 0.4 — section counts as "visited" when 40% of its area
// is in view. Avoids spurious fires for thin sections that briefly
// peek into the viewport during scroll.
//
// `resultsViewedAt` comes from the ResultsViewedAtContext below,
// populated by app/results/page.tsx at the moment
// Analytics.resultsViewed fires. The context dodges 10-deep prop
// drilling and keeps each TrackedSection's signature small.

import { createContext, useContext, useEffect, useRef } from 'react';
import { Analytics } from '@/lib/analytics';

// ── Context ─────────────────────────────────────────────────────
// Stores the ms-epoch timestamp when the results page first mounted
// and Analytics.resultsViewed fired. Used to compute the elapsed
// seconds between verdict and per-section engagement.

const ResultsViewedAtContext = createContext<number | null>(null);

export function ResultsViewedAtProvider({
  value,
  children,
}: {
  value: number;
  children: React.ReactNode;
}) {
  return (
    <ResultsViewedAtContext.Provider value={value}>
      {children}
    </ResultsViewedAtContext.Provider>
  );
}

// ── Section wrapper ─────────────────────────────────────────────

interface TrackedSectionProps {
  sectionId: string;
  category: number;
  children: React.ReactNode;
}

export function TrackedSection({
  sectionId,
  category,
  children,
}: TrackedSectionProps) {
  const resultsViewedAt = useContext(ResultsViewedAtContext);
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    // Guard against the provider not being mounted (e.g. component
    // rendered outside ResultsViewedAtProvider). Without a baseline
    // timestamp the `time_since_results_viewed_seconds` property
    // would be meaningless, so we skip the fire entirely.
    if (resultsViewedAt === null) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            Analytics.sectionVisited({
              section: sectionId,
              category,
              time_since_results_viewed_seconds: Math.max(
                0,
                Math.round((Date.now() - resultsViewedAt) / 1000),
              ),
            });
            // Stop observing after first fire — saves a few cycles
            // when long scrolls re-cross the same section.
            obs.unobserve(el);
          }
        }
      },
      { threshold: 0.4 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [sectionId, category, resultsViewedAt]);

  return <div ref={ref}>{children}</div>;
}
