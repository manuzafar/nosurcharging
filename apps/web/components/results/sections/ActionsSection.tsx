'use client';

import { forwardRef } from 'react';
import type { ActionItem } from '@nosurcharging/calculations/types';
import { ActionList } from '@/components/results/ActionList';

interface ActionsSectionProps {
  actions: ActionItem[];
}

export const ActionsSection = forwardRef<HTMLElement, ActionsSectionProps>(
  function ActionsSection({ actions }, ref) {
    return (
      <section id="actions" data-section="actions" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '9px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Your action plan
        </p>
        <ActionList actions={actions} />
      </section>
    );
  },
);
