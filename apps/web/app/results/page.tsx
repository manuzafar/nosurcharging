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
import { ReformTimeline } from '@/components/results/ReformTimeline';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
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
    <main className="min-h-screen" style={{ background: 'var(--color-background-primary)' }}>
      {/* Site-wide disclaimer */}
      <div
        className="py-2 text-center"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <p className="text-micro" style={{ color: 'var(--color-text-tertiary)' }}>
          nosurcharging.com.au provides general guidance only. Not financial advice.
          Verify with your PSP before making business decisions.
        </p>
      </div>

      <div className="mx-auto max-w-results px-5 pb-12">
        {/* 1. Verdict — delay 0ms */}
        <div style={revealStyle(0)}>
          <VerdictSection outputs={outputs} volume={volume} pspName={pspName} />
        </div>

        {/* 2. Metrics — delay 120ms */}
        <div style={revealStyle(120)}>
          <MetricCards outputs={outputs} />
        </div>

        {/* 3. Reform Timeline — delay 180ms */}
        <div className="mt-4" style={revealStyle(180)}>
          <ReformTimeline />
        </div>

        {/* 4. Pass-through Slider — delay 240ms (Cat 2/4 only) */}
        <div className="mt-4" style={revealStyle(240)}>
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

        {/* 5. Waterfall Chart — delay 240ms */}
        <div className="mt-4" style={revealStyle(240)}>
          <WaterfallChart outputs={outputs} />
        </div>

        {/* 6. Escape Scenario Card — no delay (Cat 2/4 only) */}
        <div className="mt-4" style={revealStyle(300)}>
          <EscapeScenarioCard
            category={category}
            outputs={outputs}
            passThrough={passThrough}
            originalRaw={originalRaw}
            resolutionContext={resolutionContext}
            pspName={pspName}
          />
        </div>

        {/* 7. Action List — delay 360ms */}
        <div className="mt-6" style={revealStyle(360)}>
          <ActionList actions={actions} />
        </div>

        {/* 8. Assumptions Panel — delay 360ms */}
        <div className="mt-6" style={revealStyle(360)}>
          <AssumptionsPanel
            outputs={outputs}
            passThrough={passThrough}
            resolutionTrace={resolutionTrace}
          />
        </div>

        {/* 9. Email Capture — delay 480ms */}
        <div className="mt-8" style={revealStyle(480)}>
          <EmailCapture assessmentId={assessmentId ?? undefined} />
        </div>

        {/* 10. Consulting CTA — delay 480ms */}
        <div className="mt-6" style={revealStyle(480)}>
          <ConsultingCTA category={category} pspName={pspName} />
        </div>

        {/* 11. PSP Rate Registry */}
        <div className="mt-8" style={revealStyle(540)}>
          <PSPRateRegistry
            assessmentId={assessmentId ?? ''}
            pspName={pspName}
            planType={planType}
            volume={volume}
          />
        </div>

        {/* 12. Results Disclaimer */}
        <div className="mt-8 mb-4" style={revealStyle(600)}>
          <ResultsDisclaimer />
        </div>
      </div>
    </main>
  );
}
