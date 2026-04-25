'use client';

// CB-07: The Reveal Screen.
// t=0ms:    Reveal screen + pulsing dot + "Calculating your position..."
// t=0ms:    Server action fires IMMEDIATELY (not after reveal)
// t=600ms:  Category label fades in
// t=1100ms: Results screen replaces reveal
// If action takes >1.1s, hold on reveal until resolved.
// Error: replace reveal with error, never navigate with incomplete data.

import { useEffect, useState, useRef, useMemo } from 'react';
import { submitAssessment } from '@/actions/submitAssessment';
import type { AssessmentFormData, AssessmentResult } from '@/actions/submitAssessment';
import { trackEvent } from '@/lib/analytics';

interface RevealScreenProps {
  formData: AssessmentFormData;
  onComplete: (result: AssessmentResult) => void;
  onError: (error: string) => void;
}

export function RevealScreen({ formData, onComplete, onError }: RevealScreenProps) {
  const [showCategory, setShowCategory] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState('');

  // Generate idempotency key once per mount — stable across StrictMode re-runs
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    let cancelled = false;
    let timerDone = false;
    let result: AssessmentResult | null = null;

    // Server action fires at t=0 — immediately
    submitAssessment(formData, idempotencyKey).then((r) => {
      if (cancelled) return;
      result = r;

      if (!r.success) {
        onError(r.error ?? 'Assessment failed');
        return;
      }

      // Handle strategic rate exit and zero-cost (no standard category)
      if (r.strategicRateExit) {
        setCategoryLabel('Strategic rate — specialist guidance');
        trackEvent('assessment_submission_complete', { category: 'strategic_rate' });
      } else if (r.outputs && 'modelType' in r.outputs) {
        setCategoryLabel('Zero-cost — action required');
        trackEvent('assessment_submission_complete', { category: 'zero_cost' });
      } else {
        const cat = (r.outputs as { category: number })?.category;
        const verdicts: Record<number, string> = {
          1: 'Category 1 — your costs fall automatically',
          2: 'Category 2 — conditional saving',
          3: 'Category 3 — repricing required',
          4: 'Category 4 — act immediately',
        };
        setCategoryLabel(verdicts[cat] ?? '');
        trackEvent('assessment_submission_complete', { category: String(cat) });
      }

      if (timerDone) {
        onComplete(r);
      }
    });

    // Category label fades in at 600ms
    const categoryTimer = setTimeout(() => {
      if (!cancelled) setShowCategory(true);
    }, 600);

    // Auto-advance at 1100ms (if action is done)
    const advanceTimer = setTimeout(() => {
      timerDone = true;
      if (result?.success && !cancelled) {
        onComplete(result);
      }
    }, 1100);

    return () => {
      cancelled = true;
      clearTimeout(categoryTimer);
      clearTimeout(advanceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // role="status" + aria-live="polite" announces the calculating state
    // and the category label to screen readers without interrupting. The
    // pulsing dot is marked aria-hidden — it's decorative.
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-900"
    >
      {/* text-white/65 on bg-gray-900 computes to ~6.8:1 — passes WCAG AA.
          text-white/35 (the previous value) was ~3.1:1 and failed 1.4.3. */}
      <p className="text-caption tracking-widest text-white/65">
        Calculating your position...
      </p>

      <div
        aria-hidden
        className="h-3 w-3 rounded-full bg-accent-border animate-pulse-accent"
      />

      <p
        className={`font-serif text-body-lg text-white/60 transition-opacity duration-400 ease-out ${
          showCategory && categoryLabel ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {categoryLabel}
      </p>
    </div>
  );
}
