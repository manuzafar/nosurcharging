'use client';

import { forwardRef } from 'react';
import { BarChart2 } from 'lucide-react';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';
import { CostCompositionChart } from '@/components/results/CostCompositionChart';
import { LCRInsightPanel } from '@/components/results/LCRInsightPanel';
import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';
import { CollapsibleSection } from '@/components/results/CollapsibleSection';

interface ValuesSectionProps {
  outputs: AssessmentOutputs;
  passThrough: number;
  resolutionTrace: ResolutionTrace;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  avgTransactionValue: number;
}

export const ValuesSection = forwardRef<HTMLElement, ValuesSectionProps>(
  function ValuesSection(props, ref) {
    const {
      outputs, passThrough, resolutionTrace, volume, pspName,
      planType, msfRate, surcharging, surchargeRate, avgTransactionValue,
    } = props;

    return (
      <CollapsibleSection
        id="values"
        ref={ref}
        storageKey="results.collapsible.values"
        iconMark={<BarChart2 size={14} aria-hidden />}
        iconTint="blue"
        title="Values & rates"
        subtitle="Full cost breakdown and waterfall chart"
      >
        {/* LCR Insight Panel — flat and blended plans only */}
        {(planType === 'flat' || planType === 'blended') && (
          <div className="mb-6">
            <LCRInsightPanel
              volume={volume}
              pspName={pspName}
              planType={planType}
              avgTransactionValue={avgTransactionValue}
            />
          </div>
        )}

        <div className="mb-6">
          <CostCompositionChart
            outputs={outputs}
            passThrough={passThrough}
            pspName={pspName}
          />
        </div>

        <AssumptionsPanel
          outputs={outputs}
          passThrough={passThrough}
          resolutionTrace={resolutionTrace}
          volume={volume}
          pspName={pspName}
          planType={planType === 'blended' ? 'flat' : planType}
          msfRate={msfRate}
          surcharging={surcharging}
          surchargeRate={surchargeRate}
        />
      </CollapsibleSection>
    );
  },
);
