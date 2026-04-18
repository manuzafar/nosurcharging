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
  const suppressUntilRef = useRef<number>(0);

  useEffect(() => {
    const visibleSections = new Map<SectionId, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Skip observer updates while a programmatic scroll is in progress
        if (Date.now() < suppressUntilRef.current) return;

        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.section as SectionId;
          if (!id) continue;
          if (entry.isIntersecting) {
            visibleSections.set(id, entry.intersectionRatio);
          } else {
            visibleSections.delete(id);
          }
        }

        // Pick the first visible section in document order
        if (visibleSections.size > 0) {
          for (const id of SECTION_IDS) {
            if (visibleSections.has(id)) {
              setActiveSection(id);
              break;
            }
          }
        }
      },
      {
        rootMargin: '-60px 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    const elements = document.querySelectorAll('[data-section]');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    const el = document.querySelector(`[data-section="${id}"]`);
    if (el) {
      setActiveSection(id);
      suppressUntilRef.current = Date.now() + 800;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { activeSection, scrollToSection };
}
