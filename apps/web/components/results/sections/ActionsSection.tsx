'use client';

import { forwardRef, useState } from 'react';
import type { ActionItem, AssessmentOutputs } from '@nosurcharging/calculations/types';
import { ActionList } from '@/components/results/ActionList';
import { SubTabStrip } from '@/components/results/SubTabStrip';
import { YourOptions } from '@/components/results/sections/YourOptions';
import { IfYouDoNothing } from '@/components/results/sections/IfYouDoNothing';

const ACTIONS_TABS = [
  { key: 'action-list', label: 'Action list' },
  { key: 'your-options', label: 'Your options' },
  { key: 'do-nothing', label: 'If you do nothing' },
];

interface ActionsSectionProps {
  actions: ActionItem[];
  category: 1 | 2 | 3 | 4 | 5;
  outputs: AssessmentOutputs;
  passThrough: number;
  volume: number;
  surcharging: boolean;
  pspName: string;
}

export const ActionsSection = forwardRef<HTMLElement, ActionsSectionProps>(
  function ActionsSection({ actions, category, outputs, passThrough, volume, surcharging, pspName }, ref) {
    const [activeTab, setActiveTab] = useState('action-list');

    return (
      <section id="actions" data-section="actions" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Your action plan
        </p>

        <SubTabStrip tabs={ACTIONS_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-white border border-rule rounded-xl p-6 mt-4">
          {activeTab === 'action-list' && (
            <ActionList actions={actions} />
          )}

          {activeTab === 'your-options' && (
            <YourOptions
              category={category}
              outputs={outputs}
              passThrough={passThrough}
              volume={volume}
              surcharging={surcharging}
              pspName={pspName}
            />
          )}

          {activeTab === 'do-nothing' && (
            <IfYouDoNothing
              category={category}
              outputs={outputs}
              pspName={pspName}
            />
          )}
        </div>
      </section>
    );
  },
);
