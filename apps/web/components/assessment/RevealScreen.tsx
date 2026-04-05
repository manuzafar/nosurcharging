'use client';

// CB-07: The Reveal Screen.
// t=0ms:    Reveal screen + pulsing dot + "Calculating your position..."
// t=0ms:    Server action fires IMMEDIATELY (not after reveal)
// t=600ms:  Category label fades in
// t=1100ms: Results screen replaces reveal
// If action takes >1.1s, hold on reveal until resolved.
// Error: replace reveal with error, never navigate with incomplete data.

import { useEffect, useState, useRef } from 'react';
import { submitAssessment } from '@/actions/submitAssessment';
import type { AssessmentFormData, AssessmentResult } from '@/actions/submitAssessment';
import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import { trackEvent } from '@/lib/analytics';

interface RevealScreenProps {
  formData: AssessmentFormData;
  onComplete: (result: AssessmentResult) => void;
  onError: (error: string) => void;
}

export function RevealScreen({ formData, onComplete, onError }: RevealScreenProps) {
  const [showCategory, setShowCategory] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState('');
  const resultRef = useRef<AssessmentResult | null>(null);
  const timerDone = useRef(false);
  const actionDone = useRef(false);

  useEffect(() => {
    // Server action fires at t=0 — immediately
    submitAssessment(formData).then((result) => {
      actionDone.current = true;
      resultRef.current = result;

      if (!result.success) {
        onError(result.error ?? 'Assessment failed');
        return;
      }

      // Show category label
      const cat = result.outputs!.category;
      const verdicts: Record<number, string> = {
        1: 'Category 1 — your costs fall automatically',
        2: 'Category 2 — conditional saving',
        3: 'Category 3 — repricing required',
        4: 'Category 4 — act immediately',
      };
      setCategoryLabel(verdicts[cat] ?? '');

      trackEvent('Results viewed', { category: String(cat) });

      // If timer already done, navigate immediately
      if (timerDone.current) {
        onComplete(result);
      }
    });

    // Category label fades in at 600ms
    const categoryTimer = setTimeout(() => setShowCategory(true), 600);

    // Auto-advance at 1100ms (if action is done)
    const advanceTimer = setTimeout(() => {
      timerDone.current = true;
      if (actionDone.current && resultRef.current?.success) {
        onComplete(resultRef.current);
      }
      // If action not done yet, hold — onComplete will fire when action resolves
    }, 1100);

    return () => {
      clearTimeout(categoryTimer);
      clearTimeout(advanceTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-900">
      {/* "Calculating your position..." label */}
      <p className="text-caption tracking-widest text-white/35">
        Calculating your position...
      </p>

      {/* Pulsing amber dot */}
      <div className="h-3 w-3 rounded-full bg-amber-200 animate-pulse-amber" />

      {/* Category label — fades in at 600ms */}
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
