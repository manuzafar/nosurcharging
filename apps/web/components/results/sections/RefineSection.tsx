'use client';

import { forwardRef } from 'react';
import type {
  AssessmentOutputs,
  ResolvedAssessmentInputs,
  RawAssessmentData,
  ResolutionContext,
} from '@nosurcharging/calculations/types';
import { RefinementPanel } from '@/components/results/RefinementPanel';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';
import { EscapeScenarioCard } from '@/components/results/EscapeScenarioCard';

interface RefineSectionProps {
  outputs: AssessmentOutputs;
  resolvedInputs: ResolvedAssessmentInputs | null;
  passThrough: number;
  originalRaw: RawAssessmentData;
  resolutionContext: ResolutionContext;
  pspName: string;
  onOutputsChange: (outputs: AssessmentOutputs, pt: number) => void;
  onRefinedResult: (outputs: AssessmentOutputs) => void;
  onAccuracyChange?: (accuracy: number) => void;
}

export const RefineSection = forwardRef<HTMLElement, RefineSectionProps>(
  function RefineSection(props, ref) {
    const {
      outputs, resolvedInputs, passThrough, originalRaw,
      resolutionContext, pspName, onOutputsChange, onRefinedResult,
      onAccuracyChange,
    } = props;

    // Don't render if resolvedInputs is null (zero-cost or strategic rate)
    if (!resolvedInputs) return null;

    const category = outputs.category;

    return (
      <section id="refine" data-section="refine" ref={ref} className="pt-8">
        <p
          className="uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            fontWeight: 500,
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Refine your estimate
        </p>

        <RefinementPanel
          initialResult={outputs}
          resolutionTrace={resolvedInputs.resolutionTrace}
          inputs={resolvedInputs}
          industry={originalRaw.industry}
          onRefinedResult={onRefinedResult}
          onAccuracyChange={onAccuracyChange}
        />

        {/* PassThroughSlider — Cat 2/4 only (internally gates) */}
        <div className="mt-6">
          <PassThroughSlider
            category={category}
            passThrough={passThrough}
            outputs={outputs}
            originalRaw={originalRaw}
            resolutionContext={resolutionContext}
            pspName={pspName}
            onOutputsChange={onOutputsChange}
          />
        </div>

        {/* EscapeScenarioCard — Cat 2/4 only (internally gates) */}
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
      </section>
    );
  },
);
