'use client';

// Results page — the product.
// Loads assessment data from URL search param: /results?id=<assessmentId>
// If no ID or invalid ID, redirects to /assessment.
//
// Routing:
//   strategicRateExit → StrategicRateExitPage (no dollar figures)
//   ZeroCostOutputs   → ZeroCostResultsVariant (critical banner, before/after)
//   standard          → full results with verdict, metrics, actions, depth zone
//
// State managed here:
//   outputs: AssessmentOutputs (from server, updated by slider)
//   passThrough: number (0-1, driven by PassThroughSlider, default 0.45)
//
// All child components receive outputs and passThrough as props.
// No child component manages its own calculation state.
//
// Staggered reveal via CSS animation-delay, NOT setTimeout.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';
import type { AssessmentOutputs, ZeroCostOutputs, RawAssessmentData, ResolutionContext, ResolutionTrace, ActionItem } from '@nosurcharging/calculations/types';
import { sanitiseForHTML } from '@/lib/sanitise';

import { VerdictSection } from '@/components/results/VerdictSection';
import { MetricCards } from '@/components/results/MetricCards';
import { ProblemsBlock } from '@/components/results/ProblemsBlock';
import { DepthToggle } from '@/components/results/DepthToggle';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';
import { EscapeScenarioCard } from '@/components/results/EscapeScenarioCard';
import { CostCompositionChart } from '@/components/results/CostCompositionChart';
import { ActionList } from '@/components/results/ActionList';
import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import { EmailCapture } from '@/components/results/EmailCapture';
import { ConsultingCTA } from '@/components/results/ConsultingCTA';
import { PSPRateRegistry } from '@/components/results/PSPRateRegistry';
import { ResultsDisclaimer } from '@/components/results/ResultsDisclaimer';
import { SkeletonLoader } from '@/components/results/SkeletonLoader';
import { StrategicRateExitPage } from '@/components/results/StrategicRateExitPage';
import { ZeroCostResultsVariant } from '@/components/results/ZeroCostResultsVariant';
import { LCRInsightPanel } from '@/components/results/LCRInsightPanel';

// Section reveal styles — hoisted to module scope so they are stable
// across renders. Inline objects created inside the render function
// would still shallow-equal to React, but keeping them as module
// constants eliminates any chance of the animation restarting mid-
// interaction (e.g. while dragging the pass-through slider).
const REVEAL_STYLE: Record<number, React.CSSProperties> = {
  0:   { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '0ms' },
  120: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '120ms' },
  180: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '180ms' },
  240: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '240ms' },
  360: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '360ms' },
  540: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '540ms' },
  600: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '600ms' },
  660: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '660ms' },
  720: { opacity: 0, animation: 'fadeUp 0.4s ease forwards', animationDelay: '720ms' },
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<SkeletonLoader />}>
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
  // `actions` lives in its own state, seeded ONCE from the initial DB load.
  // It is deliberately NOT part of `outputs` — the slider recalculates
  // outputs via calculateMetrics() which returns a clean AssessmentOutputs
  // (no actions). If actions were part of outputs, every slider tick would
  // blank the ActionList, causing the section to collapse and the viewport
  // to jump. Keep actions separate and immutable after initial load.
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [passThrough, setPassThrough] = useState(0.45); // CB-08: 45% default
  const [loading, setLoading] = useState(true);
  // Track variant routing
  const [isStrategicExit, setIsStrategicExit] = useState(false);
  const [zeroCostOutputs, setZeroCostOutputs] = useState<ZeroCostOutputs | null>(null);

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

      const data = result.data;
      setAssessment(data);

      // Route by variant type
      if (data.variant_type === 'strategic_rate') {
        setIsStrategicExit(true);
        setLoading(false);
        return;
      }

      if (data.variant_type === 'zero_cost' || (data.outputs && 'modelType' in data.outputs)) {
        setZeroCostOutputs(data.outputs as ZeroCostOutputs);
        setActions((data.outputs as { actions?: ActionItem[] }).actions ?? []);
        setLoading(false);
        return;
      }

      setOutputs(data.outputs as AssessmentOutputs);
      setActions((data.outputs as { actions?: ActionItem[] }).actions ?? []);
      setLoading(false);
    });
  }, [assessmentId, router]);

  if (loading) {
    return <SkeletonLoader />;
  }

  // Strategic rate exit — no dollar figures
  if (isStrategicExit) {
    return <StrategicRateExitPage onBack={() => router.push('/assessment')} />;
  }

  // Zero-cost variant
  if (zeroCostOutputs && assessment) {
    const storedInputs = assessment.inputs as Record<string, unknown>;
    return (
      <ZeroCostResultsVariant
        outputs={zeroCostOutputs}
        volume={(storedInputs.volume as number) ?? 0}
        pspName={sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown')}
        actions={actions}
      />
    );
  }

  if (!assessment || !outputs) {
    return <SkeletonLoader />;
  }

  // ── Extract data from stored assessment ────────────────────────
  const storedInputs = assessment.inputs as Record<string, unknown>;
  const category = outputs.category;
  const volume = (storedInputs.volume as number) ?? 0;
  const pspName = sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown');
  const planType = (storedInputs.planType as 'flat' | 'costplus' | 'blended') ?? 'flat';
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

  // Normalise blended → flat for components that only accept flat|costplus
  const verdictPlanType = planType === 'blended' ? 'blended' : planType === 'costplus' ? 'costplus' : 'flat';

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-results px-5 pb-12">
        {/* ───────────────────────────── PRIMARY ZONE ───────────────────────────── */}

        {/* 1. Verdict */}
        <div style={REVEAL_STYLE[0]}>
          <VerdictSection
            outputs={outputs}
            volume={volume}
            pspName={pspName}
            planType={verdictPlanType}
            msfRate={originalRaw.msfRate}
            surcharging={originalRaw.surcharging}
            surchargeRate={originalRaw.surchargeRate}
            assessmentId={assessmentId ?? undefined}
          />
        </div>

        {/* 2. Metric cards */}
        <div style={REVEAL_STYLE[120]}>
          <MetricCards outputs={outputs} />
        </div>

        {/* 3. ProblemsBlock */}
        <div className="mt-6" style={REVEAL_STYLE[180]}>
          <ProblemsBlock
            category={category}
            pspName={pspName}
            surchargeRevenue={outputs.surchargeRevenue}
            icSaving={outputs.icSaving}
          />
        </div>

        {/* 4. ActionList */}
        <div className="mt-6" style={REVEAL_STYLE[240]}>
          <ActionList actions={actions} />
        </div>

        {/* ───────────────────────────── DEPTH ZONE ─────────────────────────────── */}

        {/* 5. DepthToggle wrapping slider, escape scenario, chart, assumptions */}
        <div style={REVEAL_STYLE[360]}>
          <DepthToggle>
            {/* 6. PassThroughSlider (Cat 2 / 4 only — internally gates) */}
            <div className="mt-6">
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
            <div className="mt-4">
              <EscapeScenarioCard
                category={category}
                outputs={outputs}
                passThrough={passThrough}
                originalRaw={originalRaw}
                resolutionContext={resolutionContext}
                pspName={pspName}
              />
            </div>

            {/* 8. LCR Insight Panel — flat and blended plans only */}
            {(planType === 'flat' || planType === 'blended') && (
              <div className="mt-6">
                <LCRInsightPanel
                  volume={volume}
                  pspName={pspName}
                  planType={planType}
                  avgTransactionValue={(storedInputs.avgTransactionValue as number) ?? 65}
                />
              </div>
            )}

            {/* 9. CostCompositionChart */}
            <div className="mt-6">
              <CostCompositionChart
                outputs={outputs}
                passThrough={passThrough}
                pspName={pspName}
              />
            </div>

            {/* 10. AssumptionsPanel */}
            <div className="mt-6">
              <AssumptionsPanel
                outputs={outputs}
                passThrough={passThrough}
                resolutionTrace={resolutionTrace}
                volume={volume}
                pspName={pspName}
                planType={planType === 'blended' ? 'flat' : planType}
                msfRate={originalRaw.msfRate}
                surcharging={originalRaw.surcharging}
                surchargeRate={originalRaw.surchargeRate}
              />
            </div>
          </DepthToggle>
        </div>

        {/* ─────────────────────────── ALWAYS VISIBLE ─────────────────────────── */}

        {/* 11. ConsultingCTA */}
        <div className="mt-8" style={REVEAL_STYLE[540]}>
          <ConsultingCTA category={category} pspName={pspName} />
        </div>

        {/* 12. EmailCapture */}
        <div className="mt-6" style={REVEAL_STYLE[600]}>
          <EmailCapture assessmentId={assessmentId ?? undefined} />
        </div>

        {/* 13. PSPRateRegistry */}
        <div className="mt-8" style={REVEAL_STYLE[660]}>
          <PSPRateRegistry
            assessmentId={assessmentId ?? ''}
            pspName={pspName}
            planType={planType === 'blended' ? 'flat' : planType}
            volume={volume}
          />
        </div>

        {/* 14. ResultsDisclaimer */}
        <div className="mt-8 mb-4" style={REVEAL_STYLE[720]}>
          <ResultsDisclaimer />
        </div>
      </div>
    </main>
  );
}
