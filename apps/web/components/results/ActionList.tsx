'use client';

// ActionList — per ux-spec §3.4, updated for Results Redesign M2.
// Left-border urgency stripes instead of full card borders.
// Summary bar with urgent/plan/monitor counts above the list.
// "Exact script" label on script blocks. 14px task text.
//
// Actions come from buildActions() in @nosurcharging/calculations.
// PSP name is inline in the action text. Never "your PSP".

import type { ActionItem, ActionPriority } from '@nosurcharging/calculations/types';

interface ActionListProps {
  actions: ActionItem[];
}

const TIER_CONFIG: Record<
  ActionPriority,
  { label: string; pillBg: string; pillColor: string; borderColor: string }
> = {
  urgent: {
    label: 'URGENT',
    pillBg: 'var(--color-background-danger)',
    pillColor: 'var(--color-text-danger)',
    borderColor: '#A32D2D',
  },
  plan: {
    label: 'PLAN',
    pillBg: '#FEF3C7',
    pillColor: '#854F0B',
    borderColor: '#854F0B',
  },
  monitor: {
    label: 'MONITOR',
    pillBg: 'var(--color-background-secondary)',
    pillColor: 'var(--color-text-tertiary)',
    borderColor: 'var(--color-border-secondary)',
  },
};

const TIER_ORDER: ActionPriority[] = ['urgent', 'plan', 'monitor'];

function sortByTier(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort(
    (a, b) => TIER_ORDER.indexOf(a.priority) - TIER_ORDER.indexOf(b.priority),
  );
}

export function ActionList({ actions }: ActionListProps) {
  const sorted = sortByTier(actions);
  const urgentCount = actions.filter((a) => a.priority === 'urgent').length;
  const planCount = actions.filter((a) => a.priority === 'plan').length;
  const monitorCount = actions.filter((a) => a.priority === 'monitor').length;

  const eyebrowId = 'action-list-eyebrow';

  return (
    <section aria-labelledby={eyebrowId}>
      {/* Section eyebrow */}
      <p
        id={eyebrowId}
        className="font-medium uppercase"
        style={{
          fontSize: '9px',
          letterSpacing: '2.5px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '12px',
        }}
      >
        What to do, in order
      </p>

      {/* Summary bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {urgentCount > 0 && (
          <span
            className="font-medium rounded-pill"
            style={{
              fontSize: '10px',
              padding: '3px 10px',
              background: 'var(--color-background-danger)',
              color: 'var(--color-text-danger)',
            }}
          >
            {urgentCount} urgent
          </span>
        )}
        {planCount > 0 && (
          <span
            className="font-medium rounded-pill"
            style={{
              fontSize: '10px',
              padding: '3px 10px',
              background: '#FEF3C7',
              color: '#854F0B',
            }}
          >
            {planCount} to plan
          </span>
        )}
        {monitorCount > 0 && (
          <span
            className="font-medium rounded-pill"
            style={{
              fontSize: '10px',
              padding: '3px 10px',
              background: 'var(--color-background-secondary)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {monitorCount} to monitor
          </span>
        )}
      </div>

      <ol className="list-none space-y-2 p-0">
        {sorted.map((action, i) => {
          const config = TIER_CONFIG[action.priority];
          return (
            <li key={i}>
              <article
                aria-label={`${config.label} — ${action.timeAnchor} — ${action.text}`}
                style={{
                  background: 'var(--color-background-primary)',
                  borderLeft: `3px solid ${config.borderColor}`,
                  padding: '14px 16px',
                  marginBottom: '2px',
                }}
              >
                {/* Header row — tier chip + date */}
                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <span
                    className="font-medium uppercase"
                    style={{
                      fontSize: '9px',
                      letterSpacing: '0.8px',
                      padding: '3px 8px',
                      background: config.pillBg,
                      color: config.pillColor,
                      borderRadius: '20px',
                    }}
                  >
                    {config.label}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '10px',
                      color: 'var(--color-accent)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {action.timeAnchor}
                  </span>
                </div>

                {/* What — the instruction (14px) */}
                <p
                  className="font-medium text-body"
                  style={{
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.5,
                    marginBottom: action.script || action.why ? '8px' : 0,
                  }}
                >
                  {action.text}
                </p>

                {/* Script — "Exact script" label + italic quote */}
                {action.script && (
                  <div style={{ marginBottom: action.why ? '8px' : 0 }}>
                    <p
                      className="uppercase font-medium"
                      style={{
                        fontSize: '9px',
                        letterSpacing: '1px',
                        color: 'var(--color-accent)',
                        marginBottom: '4px',
                      }}
                    >
                      Exact script
                    </p>
                    <blockquote
                      style={{
                        background: 'var(--color-background-secondary)',
                        borderLeft: '2px solid var(--color-accent-border)',
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {action.script}
                    </blockquote>
                  </div>
                )}

                {/* Why */}
                {action.why && (
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      lineHeight: 1.65,
                    }}
                  >
                    {action.why}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
