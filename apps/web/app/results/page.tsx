'use client';

// Results page — loads assessment data from URL search param.
// URL: /results?id=<assessmentId>
// If no ID or invalid ID, redirects to /assessment.
// Week 4 will replace the placeholder content with full results UI.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';

// Wrapper with Suspense boundary required for useSearchParams during static generation
export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-body text-gray-400">Loading results...</p>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assessmentId = searchParams.get('id');

  const [assessment, setAssessment] = useState<StoredAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) {
      router.replace('/assessment');
      return;
    }

    getAssessment(assessmentId).then((result) => {
      if (!result.success || !result.data) {
        router.replace('/assessment');
        return;
      }
      setAssessment(result.data);
      setLoading(false);
    });
  }, [assessmentId, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-body text-gray-400">Loading results...</p>
      </main>
    );
  }

  if (!assessment) {
    return null;
  }

  // Week 4: Replace this placeholder with full results UI
  // (VerdictSection, WaterfallChart, PassThroughSlider, ActionList, etc.)
  const outputs = assessment.outputs;

  return (
    <main className="mx-auto max-w-results min-h-screen px-5 py-8">
      <div className="border-b border-gray-100 pb-2 mb-8 text-center">
        <p className="text-micro text-gray-400">
          nosurcharging.com.au provides general guidance only. Not financial advice.
          Verify with your PSP before making business decisions.
        </p>
      </div>

      <p className="text-body text-gray-600">
        Results page — full UI coming in Week 4.
      </p>
      <p className="mt-2 font-mono text-body-sm text-gray-500">
        Assessment ID: {assessment.id}
      </p>
      <p className="mt-1 font-mono text-body-sm text-gray-500">
        Category: {assessment.category}
      </p>
      <p className="mt-1 font-mono text-body-sm text-gray-500">
        P&L Swing: ${outputs.plSwing?.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
      </p>
    </main>
  );
}
