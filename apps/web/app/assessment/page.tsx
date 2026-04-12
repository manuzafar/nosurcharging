'use client';

// Assessment flow: Disclaimer → Step 1 → Step 2 → Step 3 → Step 4 → Reveal → Results
// Steps 1-4 are fully client-side (no network calls).
// Network calls: (1) createSession on disclaimer, (2) recordConsent, (3) submitAssessment on reveal.
// Step transitions: opacity only, no slide animations. 200ms ease-out.
// Strategic rate selection replaces flow with inline exit page (URL unchanged).

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StepCounter } from '@/components/ui/StepCounter';
import { DisclaimerConsent } from '@/components/assessment/DisclaimerConsent';
import { Step1Volume } from '@/components/assessment/Step1Volume';
import { Step2PlanType } from '@/components/assessment/Step2PlanType';
import { Step3Surcharging } from '@/components/assessment/Step3Surcharging';
import { Step4Industry } from '@/components/assessment/Step4Industry';
import { RevealScreen } from '@/components/assessment/RevealScreen';
import { trackEvent } from '@/lib/analytics';
import type { MerchantInputOverrides } from '@nosurcharging/calculations/types';
import type { AssessmentFormData, AssessmentResult } from '@/actions/submitAssessment';

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

  // Tracking flags — fire once per session, not on every keystroke
  const expertModeTracked = useRef(false);
  const cardMixTracked = useRef(false);

  // FIX 5: Assessment abandoned event — fires on tab close/navigate away
  const currentStepRef = useRef(0);
  useEffect(() => {
    const stepMap: Record<string, number> = { step1: 1, step2: 2, step3: 3, step4: 4 };
    currentStepRef.current = stepMap[phase] ?? 0;
  }, [phase]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentStepRef.current > 0) {
        trackEvent('Assessment abandoned', { at_step: String(currentStepRef.current) });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const goToStep = (next: Phase) => {
    if (phase !== 'disclaimer' && phase !== 'reveal' && phase !== 'error') {
      const stepNum = { step1: '1', step2: '2', step3: '3', step4: '4' }[phase];
      if (stepNum) trackEvent('Step completed', { step: stepNum });
    }
    setPhase(next);
  };

  // Build form data for submission
  const buildFormData = (): AssessmentFormData => ({
    volume,
    planType: planType!,
    msfRate: 0.014,
    surcharging: surcharging!,
    surchargeRate,
    surchargeNetworks,
    industry: industry!,
    psp: psp!,
    passThrough: 0.45, // CB-08 override: 45% (RBA market average)
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
      {/* Site-wide disclaimer (FR-02). Hidden during disclaimer phase —
          the dedicated commitments screen is the disclaimer at that point. */}
      {phase !== 'disclaimer' && (
        <div className="border-b border-rule py-2 text-center">
          <p className="text-micro text-ink-faint">
            nosurcharging.com.au provides general guidance only. Not financial
            advice. Verify with your payment provider before making business
            decisions.
          </p>
        </div>
      )}

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
              trackEvent('Assessment started');
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
                  trackEvent('Plan type selected', { type: unknown ? 'dont_know' : type });
                }}
                onMsfRateModeChange={(mode) => {
                  setMsfRateMode(mode);
                  trackEvent('Zero-cost rate selected', { mode });
                }}
                onCustomMSFRateChange={setCustomMSFRate}
                onBlendedRatesChange={(debit, credit) => {
                  setBlendedDebitRate(debit);
                  setBlendedCreditRate(credit);
                  trackEvent('Blended rates entered', {
                    debit_provided: String(debit !== null),
                    credit_provided: String(credit !== null),
                  });
                }}
                onStrategicRateSelected={() => {
                  setStrategicRateSelected(true);
                  trackEvent('Strategic rate exit viewed', { trigger: 'self_select' });
                }}
                onPspChange={(name) => {
                  setPsp(name);
                  trackEvent('PSP selected', { psp: name });
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
                onNext={() => goToStep('step3')}
                onBack={() => goToStep('step1')}
              />
            )}

            {phase === 'step3' && (
              <Step3Surcharging
                surcharging={surcharging}
                surchargeRate={surchargeRate}
                surchargeNetworks={surchargeNetworks}
                onSurchargingChange={(val) => {
                  setSurcharging(val);
                  trackEvent('Surcharging selected', { value: val ? 'yes' : 'no' });
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
                  trackEvent('Industry selected', { industry: ind });
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
