'use client';

import { forwardRef, useState } from 'react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';
import { VerdictSection } from '@/components/results/VerdictSection';
import { MetricCards } from '@/components/results/MetricCards';
import { ProblemsBlock } from '@/components/results/ProblemsBlock';
import { SubTabStrip } from '@/components/results/SubTabStrip';
import { WhereIStandToday } from '@/components/results/sections/WhereIStandToday';
import { WhatsChanging } from '@/components/results/sections/WhatsChanging';
import { ReformTimeline } from '@/components/results/sections/ReformTimeline';

const OVERVIEW_TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'where-i-stand', label: 'Where I stand today' },
  { key: 'whats-changing', label: "What's changing" },
  { key: 'timeline', label: 'Reform timeline' },
];

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
    const [activeTab, setActiveTab] = useState('summary');

    return (
      <section id="overview" data-section="overview" ref={ref} className="pt-8">
        <SubTabStrip tabs={OVERVIEW_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white border border-rule rounded-xl p-6 mt-4">
          {activeTab === 'summary' && (
            <>
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
            </>
          )}

          {activeTab === 'where-i-stand' && (
            <WhereIStandToday
              outputs={outputs}
              pspName={pspName}
              volume={volume}
              planType={planType}
              surcharging={surcharging}
            />
          )}

          {activeTab === 'whats-changing' && (
            <WhatsChanging
              category={outputs.category}
              outputs={outputs}
              pspName={pspName}
            />
          )}

          {activeTab === 'timeline' && (
            <ReformTimeline
              category={outputs.category}
              pspName={pspName}
            />
          )}
        </div>
      </section>
    );
  },
);
