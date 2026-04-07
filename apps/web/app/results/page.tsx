'use client';

// Results page — the product.
// Loads assessment data from URL search param: /results?id=<assessmentId>
// If no ID or invalid ID, redirects to /assessment.
//
// State managed here:
//   outputs: AssessmentOutputs (from server, updated by slider)
//   passThrough: number (0-1, driven by PassThroughSlider)
//
// All child components receive outputs and passThrough as props.
// No child component manages its own calculation state.
//
// Staggered reveal via CSS animation-delay, NOT setTimeout.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';
import type { AssessmentOutputs, RawAssessmentData, ResolutionContext, ResolutionTrace, ActionItem } from '@nosurcharging/calculations/types';
import { sanitiseForHTML } from '@/lib/sanitise';

import { VerdictSection } from '@/components/results/VerdictSection';
import { MetricCards } from '@/components/results/MetricCards';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';
import { EscapeScenarioCard } from '@/components/results/EscapeScenarioCard';
import { ActionList } from '@/components/results/ActionList';
import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import { EmailCapture } from '@/components/results/EmailCapture';
import { ConsultingCTA } from '@/components/results/ConsultingCTA';
import { PSPRateRegistry } from '@/components/results/PSPRateRegistry';
import { ResultsDisclaimer } from '@/components/results/ResultsDisclaimer';

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
            Loading results...
          </p>
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
  const [outputs, setOutputs] = useState<AssessmentOutputs | null>(null);
  const [passThrough, setPassThrough] = useState(0);
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
      setOutputs(result.data.outputs);
      setLoading(false);
    });
  }, [assessmentId, router]);

  if (loading || !assessment || !outputs) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Loading results...
        </p>
      </main>
    );
  }

  // ── Extract data from stored assessment ────────────────────────
  const storedInputs = assessment.inputs as Record<string, unknown>;
  const actions = (outputs as unknown as { actions?: ActionItem[] }).actions ?? [];
  const category = outputs.category;
  const volume = (storedInputs.volume as number) ?? 0;
  const pspName = sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown');
  const planType = (storedInputs.planType as 'flat' | 'costplus') ?? 'flat';
  const resolutionTrace = (storedInputs.resolutionTrace as ResolutionTrace) ?? {};

  // Build raw and context for slider recalculation
  const originalRaw: RawAssessmentData = {
    volume,
    planType,
    msfRate: (storedInputs.msfRate as number) ?? 0.014,
    surcharging: (storedInputs.surcharging as boolean) ?? false,
    surchargeRate: (storedInputs.surchargeRate as number) ?? 0,
    surchargeNetworks: (storedInputs.surchargeNetworks as string[]) ?? [],
    industry: (storedInputs.industry as string) ?? 'other',
    psp: pspName,
    passThrough: 0,
    country: 'AU',
  };

  const resolutionContext: ResolutionContext = {
    country: 'AU',
    industry: originalRaw.industry,
    merchantInput: storedInputs.merchantInput as ResolutionContext['merchantInput'],
  };

  // ── Slider callback — single state update, all children re-render ──
  const handleOutputsChange = (newOutputs: AssessmentOutputs, pt: number) => {
    setOutputs(newOutputs);
    setPassThrough(pt);
  };

  // ── Section reveal animation helper ────────────────────────────
  const revealStyle = (delayMs: number): React.CSSProperties => ({
    opacity: 0,
    animation: 'fadeUp 0.4s ease forwards',
    animationDelay: `${delayMs}ms`,
  });

  return (
    <main className="min-h-screen bg-paper">
      {/* Site-wide FR-02 disclaimer banner removed from results page (Q5):
          the dedicated <ResultsDisclaimer/> at the bottom + verdict copy
          carry the legal weight. Keeping the top banner duplicates messaging. */}

      <div className="mx-auto max-w-results px-5 pb-12">
        {/* ───────────────────────────── PRIMARY ZONE ─────────────────────────────
            Always visible. Carries the verdict, the metrics, and the action plan.
            Per ux-spec §3.1 the action plan is moved up out of the depth zone so
            merchants see what to DO before they see how the numbers were derived. */}

        {/* 1. Verdict */}
        <div style={revealStyle(0)}>
          <VerdictSection
            outputs={outputs}
            volume={volume}
            pspName={pspName}
            planType={planType}
            msfRate={originalRaw.msfRate}
            surcharging={originalRaw.surcharging}
            surchargeRate={originalRaw.surchargeRate}
          />
        </div>

        {/* 2. Metric cards */}
        <div style={revealStyle(120)}>
          <MetricCards outputs={outputs} />
        </div>

        {/* 3. ProblemsBlock — added in commit 4f */}

        {/* 4. ActionList — moved up from the bottom of the page */}
        <div className="mt-6" style={revealStyle(240)}>
          <ActionList actions={actions} />
        </div>

        {/* ───────────────────────────── DEPTH ZONE ───────────────────────────────
            Reserved for the merchant who wants to understand the numbers.
            DepthToggle wrapper added in commit 4g — until then everything below
            renders inline so the page remains fully functional. */}

        {/* 5. DepthToggle — added in commit 4g */}

        {/* 6. PassThroughSlider (Cat 2 / 4 only — internally gates) */}
        <div className="mt-8" style={revealStyle(360)}>
          <PassThroughSlider
            category={category}
            passThrough={passThrough}
            outputs={outputs}
            originalRaw={originalRaw}
            resolutionContext={resolutionContext}
            pspName={pspName}
            onOutputsChange={handleOutputsChange}
          />
        </div>

        {/* 7. EscapeScenarioCard (Cat 2 / 4 only — internally gates) */}
        <div className="mt-4" style={revealStyle(420)}>
          <EscapeScenarioCard
            category={category}
            outputs={outputs}
            passThrough={passThrough}
            originalRaw={originalRaw}
            resolutionContext={resolutionContext}
            pspName={pspName}
          />
        </div>

        {/* 8. CostCompositionChart — added in commit 4i */}

        {/* 9. AssumptionsPanel */}
        <div className="mt-6" style={revealStyle(480)}>
          <AssumptionsPanel
            outputs={outputs}
            passThrough={passThrough}
            resolutionTrace={resolutionTrace}
          />
        </div>

        {/* ─────────────────────────── ALWAYS VISIBLE ─────────────────────────────
            Below the depth zone but above the legal disclaimer.
            ConsultingCTA now precedes EmailCapture per spec §3.1. */}

        {/* 10. ConsultingCTA */}
        <div className="mt-8" style={revealStyle(540)}>
          <ConsultingCTA category={category} pspName={pspName} />
        </div>

        {/* 11. EmailCapture */}
        <div className="mt-6" style={revealStyle(600)}>
          <EmailCapture assessmentId={assessmentId ?? undefined} />
        </div>

        {/* 12. PSPRateRegistry */}
        <div className="mt-8" style={revealStyle(660)}>
          <PSPRateRegistry
            assessmentId={assessmentId ?? ''}
            pspName={pspName}
            planType={planType}
            volume={volume}
          />
        </div>

        {/* 13. ResultsDisclaimer */}
        <div className="mt-8 mb-4" style={revealStyle(720)}>
          <ResultsDisclaimer />
        </div>
      </div>
    </main>
  );
}
