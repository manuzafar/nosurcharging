'use client';

// Results page — two-column sticky layout with scroll-based navigation.
//
// Routing:
//   strategicRateExit → StrategicRateExitPage (no dollar figures)
//   standard          → full results with sidebar, sections, sticky top bar
//                       (Cat 1-5 all flow through this single shell)
//
// State managed here:
//   outputs: AssessmentOutputs (from server, updated by slider/refinement)
//   actions: ActionItem[] (immutable after initial load — slider does NOT touch)
//   passThrough: number (0-1, driven by PassThroughSlider, default 0.45)

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';
import type { AssessmentOutputs, RawAssessmentData, ResolutionContext, ActionItem } from '@nosurcharging/calculations/types';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { sanitiseForHTML } from '@/lib/sanitise';
import { Analytics, getVolumeTier, getPlSwingBucket } from '@/lib/analytics';
import { useScrollSpy } from '@/hooks/useScrollSpy';

import { SkeletonLoader } from '@/components/results/SkeletonLoader';
import { StrategicRateExitPage } from '@/components/results/StrategicRateExitPage';
import { Footer } from '@/components/homepage/Footer';

// Shell
import { ResultsTopBar } from '@/components/results/shell/ResultsTopBar';
import { ResultsSidebar } from '@/components/results/shell/ResultsSidebar';
import { MobileMiniNav } from '@/components/results/shell/MobileMiniNav';
import { MobileBottomBar } from '@/components/results/shell/MobileBottomBar';

// Sections
import { OverviewSection } from '@/components/results/sections/OverviewSection';
import { ActionsSection } from '@/components/results/sections/ActionsSection';
import { ValuesSection } from '@/components/results/sections/ValuesSection';
import { RefineSection } from '@/components/results/sections/RefineSection';
import { HelpSection } from '@/components/results/sections/HelpSection';
import { TalkToCustomers } from '@/components/results/sections/TalkToCustomers';
import { NegotiationBrief } from '@/components/results/sections/NegotiationBrief';
import { ReadinessChecklist } from '@/components/results/sections/ReadinessChecklist';
import { PSPRegistrySection } from '@/components/results/sections/PSPRegistrySection';

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
  // Strategic rate exit is the only non-standard route post-Cat-5-refactor.
  const [isStrategicExit, setIsStrategicExit] = useState(false);
  // Accuracy — base 20%, updated live by RefinementPanel via onAccuracyChange
  const [accuracy, setAccuracy] = useState(20);

  // Analytics refs — set when results_viewed fires so section_visited
  // can compute time_since_results_viewed_seconds. visitedSections
  // dedupes per-page-load: each section fires section_visited at most once.
  const resultsViewTimeRef = useRef<number>(0);
  const visitedSections = useRef(new Set<string>());

  // Scroll spy — must be unconditional (Rules of Hooks).
  // Pass !loading so the observer starts AFTER sections are in the DOM.
  const { activeSection, scrollToSection } = useScrollSpy(!loading);

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

      setOutputs(data.outputs as AssessmentOutputs);
      setActions((data.outputs as { actions?: ActionItem[] }).actions ?? []);
      setLoading(false);

      // Fire results_viewed for the standard Cat 1-5 path. Strategic-rate
      // exit returned earlier above.
      // Set the time ref BEFORE the event so any section_visited that
      // races in computes a sane time_since_results_viewed_seconds.
      resultsViewTimeRef.current = Date.now();
      const stdOutputs = data.outputs as AssessmentOutputs;
      const rawInputs = data.inputs as Record<string, unknown>;
      Analytics.resultsViewed({
        assessment_id: assessmentId,
        category: stdOutputs.category,
        psp: (rawInputs.psp as string) ?? 'unknown',
        plan_type: (rawInputs.planType as string) ?? 'unknown',
        industry: (rawInputs.industry as string) ?? 'unknown',
        volume_tier: getVolumeTier((rawInputs.volume as number) ?? 0),
        pl_swing: stdOutputs.plSwing,
        pl_swing_bucket: getPlSwingBucket(stdOutputs.plSwing),
        surcharging: (rawInputs.surcharging as boolean) ?? false,
        accuracy_pct: 20,
        is_mobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      });
    });
  }, [assessmentId, router]);

  // section_visited — fires at most once per section per page load.
  // Skips 'overview' since that's the initial mount value and would fire
  // before resultsViewTimeRef is set.
  useEffect(() => {
    if (!outputs) return;
    if (activeSection === 'overview') return;
    if (visitedSections.current.has(activeSection)) return;
    visitedSections.current.add(activeSection);
    Analytics.sectionVisited({
      section: activeSection,
      category: outputs.category,
      time_since_results_viewed_seconds:
        resultsViewTimeRef.current > 0
          ? Math.round((Date.now() - resultsViewTimeRef.current) / 1000)
          : 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Resolved inputs for the RefinementPanel. Memoised on `assessment` so
  // it runs once per page load. Must live above the conditional returns
  // below — React's Rules of Hooks require unconditional ordering.
  const resolvedInputs = useMemo(() => {
    if (!assessment) return null;
    const stored = assessment.inputs as Record<string, unknown>;
    const rawPlanType = (stored.planType as RawAssessmentData['planType']) ?? 'flat';
    // Refinement only applies to the standard Cat 1-4 flow.
    // Strategic rate exit doesn't run refinement (no rate context). Cat 5
    // (zero_cost) does flow through the main shell, but RefinementPanel only
    // applies to flat/costplus/blended cost composition — skip for Cat 5.
    if (rawPlanType === 'zero_cost' || rawPlanType === 'strategic_rate') return null;
    const rawForResolve: RawAssessmentData = {
      volume: (stored.volume as number) ?? 0,
      planType: rawPlanType,
      msfRate: (stored.msfRate as number) ?? 0.014,
      surcharging: (stored.surcharging as boolean) ?? false,
      surchargeRate: (stored.surchargeRate as number) ?? 0,
      surchargeNetworks: (stored.surchargeNetworks as string[]) ?? [],
      industry: (stored.industry as string) ?? 'other',
      psp: sanitiseForHTML((stored.psp as string) ?? 'Unknown'),
      passThrough: 0,
      country: 'AU',
    };
    const ctx: ResolutionContext = {
      country: 'AU',
      industry: rawForResolve.industry,
      merchantInput: stored.merchantInput as ResolutionContext['merchantInput'],
    };
    return resolveAssessmentInputs(rawForResolve, ctx);
  }, [assessment]);

  if (loading) {
    return <SkeletonLoader />;
  }

  // Strategic rate exit — no dollar figures
  if (isStrategicExit) {
    return <StrategicRateExitPage onBack={() => router.push('/assessment')} />;
  }

  if (!assessment || !outputs) {
    return <SkeletonLoader />;
  }

  // ── Extract data from stored assessment ────────────────────────
  const storedInputs = assessment.inputs as Record<string, unknown>;
  const category = outputs.category;
  const volume = (storedInputs.volume as number) ?? 0;
  const pspName = sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown');
  const planType = (storedInputs.planType as 'flat' | 'costplus' | 'blended' | 'zero_cost') ?? 'flat';
  // Use freshly computed resolutionTrace from resolvedInputs (PB-3)
  const resolutionTrace = resolvedInputs?.resolutionTrace ?? {};

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

  // ── Urgent action count for sidebar badge ─────────────────────
  const urgentCount = actions.filter((a) => a.priority === 'urgent').length;

  // ── Slider callback — single state update, all children re-render ──
  const handleOutputsChange = (newOutputs: AssessmentOutputs, pt: number) => {
    setOutputs(newOutputs);
    setPassThrough(pt);
  };

  // ── RefinementPanel callback — updates headline P&L outputs only ──
  const handleRefinedResult = (newOutputs: AssessmentOutputs) => {
    setOutputs(newOutputs);
  };

  return (
    <div className="min-h-screen bg-paper">
      <ResultsTopBar category={category} plSwing={outputs.plSwing} accuracy={accuracy} volume={volume} assessmentId={assessmentId ?? undefined} />

      <MobileMiniNav
        activeSection={activeSection}
        onNavClick={scrollToSection}
        plSwing={outputs.plSwing}
      />

      <div className="flex">
        <ResultsSidebar
          activeSection={activeSection}
          onNavClick={scrollToSection}
          urgentCount={urgentCount}
          category={category}
        />

        <main className="flex-1 min-w-0 px-8 pb-20 md:pb-12 max-w-4xl">
          <OverviewSection
            outputs={outputs}
            volume={volume}
            pspName={pspName}
            planType={planType}
            msfRate={originalRaw.msfRate}
            surcharging={originalRaw.surcharging}
            surchargeRate={originalRaw.surchargeRate}
          />

          <ActionsSection
            actions={actions}
            category={category}
            outputs={outputs}
            passThrough={passThrough}
            volume={volume}
            surcharging={originalRaw.surcharging}
            pspName={pspName}
          />

          <TalkToCustomers category={category} pspName={pspName} />

          <NegotiationBrief
            pspName={pspName}
            planType={planType}
            volume={volume}
            category={category}
            outputs={outputs}
          />

          <ReadinessChecklist category={category} pspName={pspName} />

          <PSPRegistrySection
            assessmentId={assessmentId ?? ''}
            pspName={pspName}
            planType={planType === 'blended' || planType === 'zero_cost' ? 'flat' : planType}
            volume={volume}
            category={category}
            industry={(storedInputs.industry as string) ?? 'other'}
          />

          <ValuesSection
            outputs={outputs}
            passThrough={passThrough}
            resolutionTrace={resolutionTrace}
            volume={volume}
            pspName={pspName}
            planType={planType}
            msfRate={originalRaw.msfRate}
            surcharging={originalRaw.surcharging}
            surchargeRate={originalRaw.surchargeRate}
            avgTransactionValue={(storedInputs.avgTransactionValue as number) ?? 65}
          />

          <RefineSection
            outputs={outputs}
            resolvedInputs={resolvedInputs}
            passThrough={passThrough}
            originalRaw={originalRaw}
            resolutionContext={resolutionContext}
            pspName={pspName}
            onOutputsChange={handleOutputsChange}
            onRefinedResult={handleRefinedResult}
            onAccuracyChange={setAccuracy}
          />

          <HelpSection
            category={category}
            pspName={pspName}
            assessmentId={assessmentId ?? ''}
            plSwing={outputs.plSwing}
            volumeTier={getVolumeTier(volume)}
          />
        </main>
      </div>

      <MobileBottomBar category={category} />

      <Footer />
    </div>
  );
}
