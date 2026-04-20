'use client';

import { forwardRef } from 'react';
import type { AssessmentOutputs, ResolutionTrace } from '@nosurcharging/calculations/types';
import { CostCompositionChart } from '@/components/results/CostCompositionChart';
import { LCRInsightPanel } from '@/components/results/LCRInsightPanel';
import { AssumptionsPanel } from '@/components/results/AssumptionsPanel';

interface ValuesSectionProps {
  outputs: AssessmentOutputs;
  passThrough: number;
  resolutionTrace: ResolutionTrace;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended';
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
      <section id="values" data-section="values" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Values &amp; rates
        </p>

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
      </section>
    );
  },
);
