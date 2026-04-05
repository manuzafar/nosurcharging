'use client';

// CB-18: Urgency-tiered action list.
// Actions come from buildActions() in @nosurcharging/calculations.
// PSP name is inline in the action text. Never "your PSP".
// This component does NOT derive urgency — it reads priority from each action.
//
// Three tiers with group headers:
//   URGENT — DO THIS WEEK
//   PLAN — BEFORE AUGUST
//   MONITOR — AFTER OCTOBER

import type { ActionItem, ActionPriority } from '@nosurcharging/calculations/types';

interface ActionListProps {
  actions: ActionItem[];
}

const TIER_CONFIG: Record<
  ActionPriority,
  { header: string; pillBg: string; pillColor: string }
> = {
  urgent: {
    header: 'URGENT — DO THIS WEEK',
    pillBg: 'var(--color-background-danger)',
    pillColor: 'var(--color-text-danger)',
  },
  plan: {
    header: 'PLAN — BEFORE AUGUST',
    pillBg: 'var(--color-background-warning)',
    pillColor: 'var(--color-text-warning)',
  },
  monitor: {
    header: 'MONITOR — AFTER OCTOBER',
    pillBg: 'var(--color-background-secondary)',
    pillColor: 'var(--color-text-secondary)',
  },
};

const TIER_ORDER: ActionPriority[] = ['urgent', 'plan', 'monitor'];

export function ActionList({ actions }: ActionListProps) {
  // Group actions by priority — read from action, not derived
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    config: TIER_CONFIG[tier],
    items: actions.filter((a) => a.priority === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <h3
        className="font-serif font-medium"
        style={{ fontSize: '17px', color: 'var(--color-text-primary)' }}
      >
        Your action plan
      </h3>

      <div className="mt-4 space-y-5">
        {grouped.map((group) => (
          <div key={group.tier}>
            {/* Tier group header */}
            <p
              className="font-medium"
              style={{
                fontSize: '10px',
                letterSpacing: '1.2px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {group.config.header}
            </p>

            <div className="mt-2">
              {group.items.map((action, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-3"
                  style={
                    i < group.items.length - 1
                      ? { borderBottom: '0.5px solid var(--color-border-tertiary)' }
                      : undefined
                  }
                >
                  {/* Date chip */}
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      color: '#BA7517',
                      letterSpacing: '0.8px',
                      minWidth: '80px',
                      paddingTop: '2px',
                      lineHeight: '1.4',
                    }}
                  >
                    {action.timeAnchor}
                  </span>

                  {/* Action text with urgency pill */}
                  <div className="flex-1">
                    {/* Urgency pill */}
                    <span
                      className="inline-block mr-1.5 align-middle"
                      style={{
                        fontSize: '10px',
                        padding: '1px 7px',
                        borderRadius: '20px',
                        background: group.config.pillBg,
                        color: group.config.pillColor,
                      }}
                    >
                      {group.tier}
                    </span>

                    <span
                      className="text-body-sm"
                      style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}
                    >
                      {action.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
