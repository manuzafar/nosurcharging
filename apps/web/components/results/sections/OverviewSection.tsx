'use client';

import { forwardRef } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';
import { VerdictSection } from '@/components/results/VerdictSection';
import { MetricCards } from '@/components/results/MetricCards';
import { ProblemsBlock } from '@/components/results/ProblemsBlock';

interface OverviewSectionProps {
  outputs: AssessmentOutputs;
  volume: number;
  pspName: string;
  planType: 'flat' | 'costplus' | 'blended';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
}

export const OverviewSection = forwardRef<HTMLElement, OverviewSectionProps>(
  function OverviewSection(props, ref) {
    const { outputs, volume, pspName, planType, msfRate, surcharging, surchargeRate } = props;
    const verdictPlanType = planType === 'blended' ? 'blended' : planType === 'costplus' ? 'costplus' : 'flat';

    return (
      <section id="overview" data-section="overview" ref={ref} className="pt-8">
        <VerdictSection
          outputs={outputs}
          volume={volume}
          pspName={pspName}
          planType={verdictPlanType}
          msfRate={msfRate}
          surcharging={surcharging}
          surchargeRate={surchargeRate}
        />

        <div className="mt-6">
          <MetricCards outputs={outputs} planType={planType} />
        </div>

        <div className="mt-6">
          <ProblemsBlock
            category={outputs.category}
            pspName={pspName}
            surchargeRevenue={outputs.surchargeRevenue}
            icSaving={outputs.icSaving}
          />
        </div>
      </section>
    );
  },
);
