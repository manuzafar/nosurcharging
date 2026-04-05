'use client';

// Assessment flow: Disclaimer → Step 1 → Step 2 → Step 3 → Step 4 → Reveal → Results
// Steps 1-4 are fully client-side (no network calls).
// Network calls: (1) createSession on disclaimer, (2) recordConsent, (3) submitAssessment on reveal.
// Step transitions: opacity only, no slide animations. 200ms ease-out.

import { useState } from 'react';
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
  const [planType, setPlanType] = useState<'flat' | 'costplus' | null>(null);
  const [psp, setPsp] = useState<string | null>(null);
  const [merchantInput, setMerchantInput] = useState<MerchantInputOverrides>({});
  const [surcharging, setSurcharging] = useState<boolean | null>(null);
  const [surchargeRate, setSurchargeRate] = useState(0);
  const [surchargeNetworks, setSurchargeNetworks] = useState<string[]>([]);
  const [industry, setIndustry] = useState<string | null>(null);

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
    msfRate: 0.014, // Default MSF for flat rate — Phase 2 will allow input
    surcharging: surcharging!,
    surchargeRate,
    surchargeNetworks,
    industry: industry!,
    psp: psp!,
    passThrough: 0, // Default — slider on results page adjusts this
    merchantInput: Object.keys(merchantInput).length > 0 ? merchantInput : undefined,
  });

  const handleRevealComplete = (result: AssessmentResult) => {
    // Store result in sessionStorage for the results page
    sessionStorage.setItem('ns_assessment_result', JSON.stringify(result));
    sessionStorage.setItem('ns_assessment_form', JSON.stringify(buildFormData()));
    router.push('/results');
  };

  const handleRevealError = (err: string) => {
    setError(err);
    setPhase('error');
  };

  const currentStep =
    phase === 'step1' ? 1 : phase === 'step2' ? 2 : phase === 'step3' ? 3 : phase === 'step4' ? 4 : 0;

  return (
    <main className="min-h-screen bg-white">
      {/* Site-wide disclaimer */}
      <div className="border-b border-gray-100 py-2 text-center">
        <p className="text-micro text-gray-400">
          nosurcharging.com.au provides general guidance only. Not financial advice.
          Verify with your PSP before making business decisions.
        </p>
      </div>

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

      {/* Assessment steps */}
      {phase !== 'reveal' && phase !== 'error' && (
        <div className="mx-auto max-w-assessment px-5 py-8">
          {/* Progress bar + step counter (hidden on disclaimer) */}
          {phase !== 'disclaimer' && (
            <div className="mb-8 flex items-center gap-4">
              <div className="flex-1">
                <ProgressBar currentStep={currentStep} />
              </div>
              <StepCounter current={currentStep} />
            </div>
          )}

          {/* Step content with opacity transition */}
          <div className="transition-opacity duration-200 ease-out">
            {phase === 'disclaimer' && (
              <DisclaimerConsent
                onAccept={() => {
                  trackEvent('Assessment started');
                  goToStep('step1');
                }}
              />
            )}

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
                psp={psp}
                merchantInput={merchantInput}
                onPlanTypeChange={(type) => {
                  setPlanType(type);
                  trackEvent('Plan type selected', { type });
                }}
                onPspChange={(name) => {
                  setPsp(name);
                  trackEvent('PSP selected', { psp: name });
                }}
                onMerchantInputChange={setMerchantInput}
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
