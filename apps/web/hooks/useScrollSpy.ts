'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SectionId } from '@/components/results/shell/types';
import { SECTION_IDS } from '@/components/results/shell/types';

interface UseScrollSpyReturn {
  activeSection: SectionId;
  scrollToSection: (id: SectionId) => void;
}

export function useScrollSpy(): UseScrollSpyReturn {
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Map to track how much of each section is visible — never delete,
    // only overwrite. This avoids the "empty map" gap that caused the
    // previous implementation to get stuck.
    const visibilityMap: Record<string, number> = {};

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap[entry.target.id] = entry.intersectionRatio;
        });

        // The active section is whichever has the most visibility.
        // If tied, prefer the one that appears first in SECTION_IDS (higher on page).
        let maxRatio = 0;
        let newActive: SectionId = 'overview';

        for (const id of SECTION_IDS) {
          const ratio = visibilityMap[id] ?? 0;
          if (ratio > maxRatio) {
            maxRatio = ratio;
            newActive = id;
          }
        }

        setActiveSection(newActive);
      },
      {
        // Offset from top accounts for the 44px sticky top bar
        rootMargin: '-44px 0px -40% 0px',
        // Fire at multiple thresholds for smooth tracking
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      },
    );

    // Observe all section elements
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { activeSection, scrollToSection };
}
