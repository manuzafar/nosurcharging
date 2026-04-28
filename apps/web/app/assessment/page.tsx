'use client';

// Assessment flow: Disclaimer → Step 1 → Step 2 → Step 3 → Step 4 → Reveal → Results
// Steps 1-4 are fully client-side (no network calls).
// Network calls: (1) createSession on disclaimer, (2) recordConsent, (3) submitAssessment on reveal.
// Step transitions: opacity only, no slide animations. 200ms ease-out.
// Strategic rate selection replaces flow with inline exit page (URL unchanged).

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StepCounter } from '@/components/ui/StepCounter';
import { DisclaimerConsent } from '@/components/assessment/DisclaimerConsent';
import { Step1Volume } from '@/components/assessment/Step1Volume';
import { Step2PlanType } from '@/components/assessment/Step2PlanType';
import { Step3Surcharging } from '@/components/assessment/Step3Surcharging';
import { Step4Industry } from '@/components/assessment/Step4Industry';
import { RevealScreen } from '@/components/assessment/RevealScreen';
import { trackEvent, Analytics, getVolumeTier } from '@/lib/analytics';
import type { MerchantInputOverrides } from '@nosurcharging/calculations/types';
import type { AssessmentFormData, AssessmentResult } from '@/actions/submitAssessment';
import { PSP_PUBLISHED_RATES } from '@nosurcharging/calculations/constants/psp-rates';

type Phase = 'disclaimer' | 'step1' | 'step2' | 'step3' | 'step4' | 'reveal' | 'error';

export default function AssessmentPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('disclaimer');
  const [error, setError] = useState<string | null>(null);

  // Form state — persists across steps
  const [volume, setVolume] = useState(0);
  const [planType, setPlanType] = useState<'flat' | 'costplus' | 'blended' | 'zero_cost' | null>(null);
  const [psp, setPsp] = useState<string | null>(null);
  const [merchantInput, setMerchantInput] = useState<MerchantInputOverrides>({});
  const [surcharging, setSurcharging] = useState<boolean | null>(null);
  const [surchargeRate, setSurchargeRate] = useState(0);
  const [surchargeNetworks, setSurchargeNetworks] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);

  // Iteration 2 state
  const [msfRateMode, setMsfRateMode] = useState<'unselected' | 'market_estimate' | 'custom'>('unselected');
  const [customMSFRate, setCustomMSFRate] = useState<number | null>(null);
  const [blendedDebitRate, setBlendedDebitRate] = useState<number | null>(null);
  const [blendedCreditRate, setBlendedCreditRate] = useState<number | null>(null);
  const [strategicRateSelected, setStrategicRateSelected] = useState(false);
  const [planTypeUnknown, setPlanTypeUnknown] = useState(false);

  // Flat-rate MSF — SPRINT_BRIEF.md Sprint 2 UX-06. Default 1.4% (market
  // average) until the merchant picks a PSP, at which point we pre-fill
  // from PSP_PUBLISHED_RATES. Merchant can confirm or override.
  // `msfRateUserEdited` stays true once the merchant types a value so that
  // subsequent PSP changes don't overwrite their input.
  const [msfRate, setMsfRate] = useState(0.014);
  const [msfRateUserEdited, setMsfRateUserEdited] = useState(false);

  // Tracking flags — fire once per session, not on every keystroke
  const expertModeTracked = useRef(false);
  const cardMixTracked = useRef(false);

  // Time-on-task — used for assessment_abandoned `time_spent_seconds`.
  const startTimeRef = useRef(Date.now());

  // step_completed deduplication — each step fires at most once per session
  // even if the merchant goes back and forth.
  const visitedSteps = useRef(new Set<number>());

  // Assessment abandoned event — fires on tab close/navigate away
  const currentStepRef = useRef(0);
  useEffect(() => {
    const stepMap: Record<string, number> = { step1: 1, step2: 2, step3: 3, step4: 4 };
    currentStepRef.current = stepMap[phase] ?? 0;
  }, [phase]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentStepRef.current > 0) {
        Analytics.assessmentAbandoned(
          currentStepRef.current,
          Math.round((Date.now() - startTimeRef.current) / 1000),
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const goToStep = (next: Phase) => {
    // Fire enriched step_completed for the OUTGOING step. Deduped via Set so
    // back-and-forth navigation doesn't double-fire.
    const stepMap: Record<string, 1 | 2 | 3 | 4> = { step1: 1, step2: 2, step3: 3, step4: 4 };
    const stepNum = stepMap[phase];
    if (stepNum && !visitedSteps.current.has(stepNum)) {
      visitedSteps.current.add(stepNum);
      if (stepNum === 1) {
        Analytics.stepCompleted(1, {
          volume_tier: getVolumeTier(volume),
          input_mode: 'annual',
        });
      } else if (stepNum === 2) {
        Analytics.stepCompleted(2, {
          plan_type: planType ?? '',
          psp: psp ?? '',
        });
      } else if (stepNum === 3) {
        const isAmexOnly =
          surchargeNetworks.length > 0 &&
          surchargeNetworks.every((n) => ['amex', 'bnpl'].includes(n));
        Analytics.stepCompleted(3, {
          surcharging: surcharging ?? false,
          surcharge_networks: JSON.stringify(surchargeNetworks),
          surcharge_rate: surchargeRate,
          is_amex_only: isAmexOnly,
          amex_warning_shown: surcharging === true && isAmexOnly,
        });
      } else if (stepNum === 4) {
        Analytics.stepCompleted(4, { industry: industry ?? '' });
      }
    }
    setPhase(next);
  };

  // Build form data for submission
  const buildFormData = (): AssessmentFormData => ({
    volume,
    planType: planType!,
    msfRate,
    surcharging: surcharging!,
    surchargeRate,
    surchargeNetworks,
    industry: industry!,
    psp: psp!,
    passThrough: 0.45, // CB-08 override: 45% — central scenario assumption
    merchantInput: Object.keys(merchantInput).length > 0 ? merchantInput : undefined,
    msfRateMode: planType === 'zero_cost' ? msfRateMode : undefined,
    customMSFRate: planType === 'zero_cost' && msfRateMode === 'custom' ? customMSFRate ?? undefined : undefined,
    blendedDebitRate: planType === 'blended' ? blendedDebitRate ?? undefined : undefined,
    blendedCreditRate: planType === 'blended' ? blendedCreditRate ?? undefined : undefined,
    planTypeUnknown: planTypeUnknown || undefined,
  });

  const handleRevealComplete = (result: AssessmentResult) => {
    // Navigate to results with assessmentId as search param
    // Results page fetches full data from server via assessmentId
    router.push(`/results?id=${result.assessmentId}`);
  };

  const handleRevealError = (err: string) => {
    setError(err);
    setPhase('error');
  };

  // Strategic rate inline exit — replaces entire flow, URL unchanged
  if (strategicRateSelected) {
    return (
      <main className="min-h-screen bg-paper">
        <div className="mx-auto max-w-assessment px-5 py-8">
          <div className="text-center">
            <p className="text-label tracking-widest text-accent">STRATEGIC RATE</p>
            <h2 className="mt-4 font-serif text-heading-lg">
              You may have a strategic interchange rate
            </h2>
            <p className="mt-4 text-body text-gray-600">
              Merchants processing over $50M annually or with self-reported strategic rates
              typically have individually negotiated interchange arrangements that fall
              outside standard category analysis.
            </p>
            <p className="mt-4 text-body text-gray-600">
              Our standard assessment cannot accurately model your position.
              We recommend specialist guidance for your pricing review.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => setStrategicRateSelected(false)}
                className="rounded-lg border border-gray-200 px-6 py-2 text-body-sm text-gray-600
                  hover:border-gray-300 transition-colors duration-150"
              >
                Back to assessment
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentStep =
    phase === 'step1' ? 1 : phase === 'step2' ? 2 : phase === 'step3' ? 3 : phase === 'step4' ? 4 : 0;

  return (
    <main className="min-h-screen bg-paper">
      {/* Branded nav — matches the homepage nav (ink bg, italic accent
          logo). No CTA on the right because the assessment has its own
          Next/Back navigation. Renders on every phase including the
          disclaimer screen. */}
      <nav
        className="sticky top-0 z-20 flex items-center bg-ink px-5"
        style={{ height: '52px' }}
      >
        <Link
          href="/"
          className="font-serif font-medium text-white"
          style={{ fontSize: '16px' }}
        >
          no
          <span className="italic" style={{ color: '#72C4B0' }}>
            surcharging
          </span>
          <span
            className="hidden text-white/60 min-[400px]:inline"
            style={{ fontSize: '13px' }}
          >
            .com.au
          </span>
        </Link>
      </nav>

      {/* Reveal screen is full-screen overlay */}
      {phase === 'reveal' && (
        <RevealScreen
          formData={buildFormData()}
          onComplete={handleRevealComplete}
          onError={handleRevealError}
        />
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="flex min-h-[60vh] items-center justify-center px-5">
          <div className="max-w-assessment text-center">
            <h2 className="font-serif text-heading-lg text-red-800">Something went wrong</h2>
            <p className="mt-3 text-body text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() => setPhase('step4')}
              className="mt-6 rounded-lg border border-gray-200 px-6 py-2 text-body-sm text-gray-600
                hover:border-gray-300 transition-colors duration-150"
            >
              Go back and try again
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer phase — DisclaimerConsent owns its own width and padding
          (paper canvas, max-w 420). No outer wrapper needed. */}
      {phase === 'disclaimer' && (
        <div className="transition-opacity duration-200 ease-out">
          <DisclaimerConsent
            onAccept={() => {
              Analytics.assessmentStarted();
              goToStep('step1');
            }}
          />
        </div>
      )}

      {/* Assessment steps 1-4 */}
      {phase !== 'reveal' && phase !== 'error' && phase !== 'disclaimer' && (
        <div className="mx-auto max-w-assessment px-5 py-8">
          {/* Progress bar + step counter */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar currentStep={currentStep} />
            </div>
            <StepCounter current={currentStep} />
          </div>

          {/* Step content with opacity transition */}
          <div className="transition-opacity duration-200 ease-out">
            {phase === 'step1' && (
              <Step1Volume
                value={volume}
                onChange={setVolume}
                onNext={() => goToStep('step2')}
                onBack={() => goToStep('disclaimer')}
              />
            )}

            {phase === 'step2' && (
              <Step2PlanType
                planType={planType}
                msfRateMode={msfRateMode}
                customMSFRate={customMSFRate}
                blendedDebitRate={blendedDebitRate}
                blendedCreditRate={blendedCreditRate}
                psp={psp}
                merchantInput={merchantInput}
                volume={volume}
                onPlanTypeChange={(type, unknown) => {
                  setPlanType(type);
                  setPlanTypeUnknown(unknown ?? false);
                  // plan_type is captured in step_completed (step 2). The
                  // standalone 'Plan type selected' event was redundant —
                  // the funnel only cares about the value at completion.
                }}
                onMsfRateModeChange={(mode) => {
                  setMsfRateMode(mode);
                  Analytics.zeroCostRateSelected({ mode });
                }}
                onCustomMSFRateChange={setCustomMSFRate}
                onBlendedRatesChange={(debit, credit) => {
                  setBlendedDebitRate(debit);
                  setBlendedCreditRate(credit);
                  Analytics.blendedRatesEntered({
                    debit_provided: debit !== null,
                    credit_provided: credit !== null,
                  });
                }}
                onStrategicRateSelected={() => {
                  setStrategicRateSelected(true);
                  Analytics.strategicRateExitViewed({ trigger: 'self_select' });
                }}
                onPspChange={(name) => {
                  setPsp(name);
                  // SPRINT_BRIEF.md Sprint 2 UX-06: pre-fill flat-rate MSF
                  // from published rates. Only overwrite if the merchant
                  // hasn't manually edited the field — their input wins.
                  if (!msfRateUserEdited) {
                    const published = PSP_PUBLISHED_RATES[name];
                    if (published) setMsfRate(published.standardMsf);
                  }
                  // psp is captured in step_completed (step 2). The
                  // standalone 'PSP selected' event was redundant.
                }}
                msfRate={msfRate}
                onMsfRateChange={(rate) => {
                  setMsfRate(rate);
                  setMsfRateUserEdited(true);
                }}
                onMerchantInputChange={(input) => {
                  // FIX 5: Expert mode activated — fire once when expert rates first provided
                  if (
                    !expertModeTracked.current &&
                    input.expertRates &&
                    (input.expertRates.debitCents !== undefined ||
                      input.expertRates.creditPct !== undefined ||
                      input.expertRates.marginPct !== undefined)
                  ) {
                    trackEvent('Expert mode activated');
                    expertModeTracked.current = true;
                  }

                  // FIX 5: Card mix entered — fire once when any card mix field filled
                  if (!cardMixTracked.current && input.cardMix) {
                    const filled = Object.values(input.cardMix).filter(
                      (v) => v !== undefined && v !== null && v > 0,
                    ).length;
                    if (filled > 0) {
                      trackEvent('Card mix entered', { fields_filled: filled });
                      cardMixTracked.current = true;
                    }
                  }

                  setMerchantInput(input);
                }}
                onNext={() => {
                  // Cat 5 pre-fill: zero-cost surcharge mechanism always covers
                  // Visa/Mastercard/eftpos. Pre-set so Step 3 can ask only the
                  // remaining question (separate Amex surcharge).
                  if (planType === 'zero_cost' && surchargeNetworks.length === 0) {
                    setSurchargeNetworks(['visa', 'mastercard', 'eftpos']);
                  }
                  goToStep('step3');
                }}
                onBack={() => goToStep('step1')}
              />
            )}

            {phase === 'step3' && (
              <Step3Surcharging
                mode={planType === 'zero_cost' ? 'zero_cost' : 'standard'}
                surcharging={surcharging}
                surchargeRate={surchargeRate}
                surchargeNetworks={surchargeNetworks}
                onSurchargingChange={(val) => {
                  setSurcharging(val);
                  // surcharging is captured in step_completed (step 3).
                }}
                onSurchargeRateChange={setSurchargeRate}
                onNetworksChange={setSurchargeNetworks}
                onNext={() => goToStep('step4')}
                onBack={() => goToStep('step2')}
              />
            )}

            {phase === 'step4' && (
              <Step4Industry
                industry={industry}
                onIndustryChange={(ind) => {
                  setIndustry(ind);
                  // industry is captured in step_completed (step 4).
                }}
                onNext={() => setPhase('reveal')}
                onBack={() => goToStep('step3')}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
