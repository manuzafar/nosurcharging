'use client';

// Results page — single-column linear scroll (Ruthless Cut M1).
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md, the previous shell
// (sidebar + sub-tabs + section observer) is gone. Sections that
// owned editorial content move to the PDF artifact (M3); the page
// now mounts the surviving components in scroll order.
//
// M1 scope: structural cut only. Visual restyles (VerticalActionSteps
// hairline, RefinementPanel settings-list, ContextParagraph extraction,
// ArtifactCard, print stylesheet, ReformTimelineCompact, QuietUpsell)
// land in M2. PDF + 48h retention land in M3.
//
// Routing:
//   strategicRateExit → StrategicRateExitPage (no dollar figures)
//   standard          → linear results page (Cat 1-5)
//
// State managed here:
//   outputs:     AssessmentOutputs (server, updated by slider/refinement)
//   actions:     ActionItem[] (immutable after initial load)
//   passThrough: 0-1, default 0.45 (CB-08 centre estimate)
//   accuracy:    base 20%, updated by RefinementPanel — moves into
//                RefinementPanel header in M2; lives here for now.

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';
import type {
  AssessmentOutputs,
  RawAssessmentData,
  ResolutionContext,
  ActionItem,
} from '@nosurcharging/calculations/types';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { sanitiseForHTML } from '@/lib/sanitise';
import { Analytics, getVolumeTier, getPlSwingBucket } from '@/lib/analytics';

import { SkeletonLoader } from '@/components/results/SkeletonLoader';
import { StrategicRateExitPage } from '@/components/results/StrategicRateExitPage';
import { Footer } from '@/components/homepage/Footer';

import { ResultsTopBar } from '@/components/results/shell/ResultsTopBar';

import { Lightbulb, Calculator } from 'lucide-react';

import { VerdictSection } from '@/components/results/VerdictSection';
import { ContextParagraph } from '@/components/results/ContextParagraph';
import { MetricCards } from '@/components/results/MetricCards';
import { ProblemsBlock } from '@/components/results/ProblemsBlock';
import { SectionHeader } from '@/components/results/SectionHeader';
import { AccuracyMeter } from '@/components/results/AccuracyMeter';
import {
  VerticalActionSteps,
  actionCountText,
} from '@/components/results/VerticalActionSteps';
import { ReformTimelineCompact } from '@/components/results/sections/ReformTimelineCompact';
import { RefinementPanel } from '@/components/results/RefinementPanel';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';
import { EscapeScenarioCard } from '@/components/results/EscapeScenarioCard';
import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import { ArtifactCard } from '@/components/results/sections/ArtifactCard';
import { QuietUpsell } from '@/components/results/QuietUpsell';
import { ResultsDisclaimer } from '@/components/results/ResultsDisclaimer';

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
  // Explicit expired state — Cat 1\u20135 row past its 48h TTL. Shown as a
  // dedicated view rather than redirecting, so the merchant understands
  // their data was deleted (the brand promise) and can retake without
  // a silent reroute.
  const [expired, setExpired] = useState(false);
  // `actions` is seeded once from the initial DB load and is deliberately
  // separate from `outputs`. The slider recalculates outputs without
  // touching actions — keeping them split prevents the action list from
  // remounting on every slider tick.
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [passThrough, setPassThrough] = useState(0.45); // CB-08
  const [loading, setLoading] = useState(true);
  const [isStrategicExit, setIsStrategicExit] = useState(false);
  const [accuracy, setAccuracy] = useState(20);

  useEffect(() => {
    if (!assessmentId) {
      router.replace('/assessment');
      return;
    }

    getAssessment(assessmentId).then((result) => {
      if (!result.success) {
        if (result.error === 'expired') {
          setExpired(true);
          setLoading(false);
          return;
        }
        router.replace('/assessment');
        return;
      }

      const data = result.data;
      setAssessment(data);

      if (data.variant_type === 'strategic_rate') {
        setIsStrategicExit(true);
        setLoading(false);
        return;
      }

      setOutputs(data.outputs as AssessmentOutputs);
      setActions((data.outputs as { actions?: ActionItem[] }).actions ?? []);
      setLoading(false);

      // results_viewed fires once for the standard Cat 1-5 path.
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
        is_mobile:
          typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      });
    });
  }, [assessmentId, router]);

  // Resolved inputs — feeds RefinementPanel. Memoised on `assessment` so it
  // runs once per page load. Must live above conditional returns (Rules of
  // Hooks). Returns null for zero-cost / strategic-rate, which RefinementPanel
  // (gated below) treats as the no-render case.
  const resolvedInputs = useMemo(() => {
    if (!assessment) return null;
    const stored = assessment.inputs as Record<string, unknown>;
    const rawPlanType =
      (stored.planType as RawAssessmentData['planType']) ?? 'flat';
    if (rawPlanType === 'zero_cost' || rawPlanType === 'strategic_rate')
      return null;
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

  if (loading) return <SkeletonLoader />;

  if (expired) {
    return <ExpiredView onRetake={() => router.push('/assessment')} />;
  }

  if (isStrategicExit) {
    return <StrategicRateExitPage onBack={() => router.push('/assessment')} />;
  }

  if (!assessment || !outputs) return <SkeletonLoader />;

  // ── Inputs derived from the stored assessment row ────────────────────
  const storedInputs = assessment.inputs as Record<string, unknown>;
  const category = outputs.category;
  const volume = (storedInputs.volume as number) ?? 0;
  const pspName = sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown');
  const planType =
    (storedInputs.planType as 'flat' | 'costplus' | 'blended' | 'zero_cost') ??
    'flat';
  const resolutionTrace = resolvedInputs?.resolutionTrace ?? {};

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

  // Slider callback — single state update; all children re-render.
  const handleOutputsChange = (newOutputs: AssessmentOutputs, pt: number) => {
    setOutputs(newOutputs);
    setPassThrough(pt);
  };

  // RefinementPanel callback — updates headline P&L outputs only.
  const handleRefinedResult = (newOutputs: AssessmentOutputs) => {
    setOutputs(newOutputs);
  };

  // Accuracy threshold colouring previously lived here as a helper for
  // the SectionHeader meta. The polish pass replaces the bare percent
  // with an <AccuracyMeter /> mini progress bar — the threshold rule
  // is no longer needed at this level.

  return (
    <div className="min-h-screen bg-paper">
      <ResultsTopBar
        category={category}
        plSwing={outputs.plSwing}
        volume={volume}
        assessmentId={assessmentId ?? undefined}
      />

      <main className="mx-auto max-w-3xl pb-20 min-[501px]:pb-12 pt-6">
        {/* Hero — situation pill, eyebrow, P&L hero number, one-sentence
            verdict. Nothing else competes (per Ruthless Cut brief §2). */}
        <VerdictSection outputs={outputs} />

        {/* Context paragraph — 2–3 sentences in plain English. */}
        <ContextParagraph category={category} pspName={pspName} />

        {/* Numbers — 3-mode metric cards. */}
        <SectionHeader eyebrow="The numbers" />
        <div className="px-5 min-[501px]:px-8">
          <MetricCards
            outputs={outputs}
            planType={planType}
            volume={volume}
          />
        </div>

        {/* Why this is happening — Cat-conditional problem cards.
            ProblemsBlock returns null for Cat 1 (nothing to flag); the
            SectionHeader is suppressed so we don't leave a stub eyebrow
            sitting above empty space. */}
        {category !== 1 && (
          <>
            <SectionHeader eyebrow="Why this is happening" />
            <div className="px-5 min-[501px]:px-8">
              <ProblemsBlock
                category={category}
                pspName={pspName}
                surchargeRevenue={outputs.surchargeRevenue}
                icSaving={outputs.icSaving}
                octNet={outputs.octNet}
                estimatedMSFRate={outputs.estimatedMSFRate}
              />
            </div>
          </>
        )}

        {/* Action plan — vertical numbered timeline. The count meta
            ("X urgent · Y plan · Z monitor") is computed by the helper
            that VerticalActionSteps exports so the page doesn't
            duplicate the priority-counting logic. */}
        <SectionHeader
          eyebrow="What to do, in order"
          meta={actionCountText(actions) || undefined}
        />
        <VerticalActionSteps actions={actions} />

        {/* Reform timeline — compact 5-row calendar. */}
        <SectionHeader eyebrow="Reform timeline" />
        <ReformTimelineCompact />

        {/* Refine — only renders when resolvedInputs exist (skips
            zero-cost + strategic-rate variants). PassThroughSlider +
            EscapeScenarioCard internally gate to Cat 2 / 4. */}
        {resolvedInputs && (
          <>
            <SectionHeader
              eyebrow="Refine your estimate"
              meta={<AccuracyMeter pct={accuracy} />}
            />
            <RefinementPanel
              initialResult={outputs}
              resolutionTrace={resolutionTrace}
              inputs={resolvedInputs}
              industry={originalRaw.industry}
              onRefinedResult={handleRefinedResult}
              onAccuracyChange={setAccuracy}
            />

            {(category === 2 || category === 4) && (
              <>
                <SectionHeader
                  eyebrow="Model your outcome"
                  meta={`~${Math.round(passThrough * 100)}% pass-through · centre estimate`}
                />
                <div className="px-5 min-[501px]:px-8">
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

                <SectionHeader
                  eyebrow="Is there a better option?"
                  eyebrowIcon={<Lightbulb size={14} aria-hidden />}
                />
                <div className="px-5 min-[501px]:px-8">
                  <EscapeScenarioCard
                    category={category}
                    outputs={outputs}
                    passThrough={passThrough}
                    originalRaw={originalRaw}
                    resolutionContext={resolutionContext}
                    pspName={pspName}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Assumptions — expand-on-demand. M3 polish: a real
            SectionHeader sits above the toggle for visual consistency
            with every other editorial section. The toggle inside the
            panel is now a plain inline link, no top hairline of its own. */}
        <SectionHeader
          eyebrow="How we calculated this"
          eyebrowIcon={<Calculator size={14} aria-hidden />}
        />
        <div className="px-5 min-[501px]:px-8">
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

        {/* Save the full report — pre-fills email captured at EmailGate. */}
        <SectionHeader eyebrow="Save the full report" />
        <ArtifactCard
          assessmentId={assessmentId ?? ''}
          initialEmail={assessment.email}
        />

        {/* Quiet upsell — single-line $149 link replaces the dark card. */}
        <div className="pt-7">
          <QuietUpsell
            category={category}
            pspName={pspName}
            plSwing={outputs.plSwing}
            volumeTier={getVolumeTier(volume)}
          />
        </div>

        <div className="px-5 min-[501px]:px-8 pt-9">
          <ResultsDisclaimer />
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Expired view ───────────────────────────────────────────────
// Renders when getAssessment returns { error: 'expired' } — the
// assessment row is past its 48h TTL and was deleted on this load.
// Per the brand promise ("we don't keep your data"), the merchant
// gets an explicit explanation rather than a silent reroute.

function ExpiredView({ onRetake }: { onRetake: () => void }) {
  return (
    <div
      className="min-h-screen bg-paper flex flex-col"
      role="status"
      aria-live="polite"
    >
      <main className="mx-auto max-w-xl px-5 pt-20 pb-12 flex-1">
        <p
          className="font-bold uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.8px',
            color: 'var(--color-text-tertiary)',
            marginBottom: '12px',
          }}
        >
          This assessment has expired
        </p>
        <h1
          className="font-serif"
          style={{
            fontSize: '24px',
            lineHeight: 1.4,
            color: 'var(--color-text-primary)',
            fontWeight: 500,
            marginBottom: '16px',
          }}
        >
          We delete every assessment within 48 hours of submission.
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            marginBottom: '24px',
          }}
        >
          That&apos;s the brand promise — your figures are yours, and we
          don&apos;t keep them past the window where they could be useful to
          you. If you saved your PDF when you ran the assessment, that&apos;s
          your persistent record. Otherwise, the assessment is quick to
          retake.
        </p>
        <button
          type="button"
          onClick={onRetake}
          className="cursor-pointer hover:opacity-90 font-bold"
          style={{
            background: 'var(--color-accent)',
            color: '#FFFFFF',
            fontSize: '14px',
            padding: '12px 22px',
            borderRadius: '100px',
            border: 'none',
          }}
        >
          Retake the assessment
        </button>
      </main>
      <Footer />
    </div>
  );
}
