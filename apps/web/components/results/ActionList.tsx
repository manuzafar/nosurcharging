'use client';

// ActionList — per ux-spec §3.4.
// Each action renders as a card with four parts:
//   1. Header row    — tier chip + monospace date
//   2. What text     — the instruction itself (13px, 500, primary)
//   3. Script block  — italic, paper background, accent border-left
//   4. Why text      — small, tertiary
//
// Actions come from buildActions() in @nosurcharging/calculations.
// PSP name is inline in the action text. Never "your PSP".

import type { ActionItem, ActionPriority } from '@nosurcharging/calculations/types';

interface ActionListProps {
  actions: ActionItem[];
}

const TIER_CONFIG: Record<
  ActionPriority,
  { label: string; pillBg: string; pillColor: string }
> = {
  urgent: {
    label: 'URGENT',
    pillBg: 'var(--color-background-danger)',
    pillColor: 'var(--color-text-danger)',
  },
  plan: {
    label: 'PLAN',
    // accent-light bg + accent text (no CSS var; matches DepthToggle / ProblemsBlock)
    pillBg: '#EBF6F3',
    pillColor: '#1A6B5A',
  },
  monitor: {
    label: 'MONITOR',
    pillBg: 'var(--color-background-secondary)',
    pillColor: 'var(--color-text-tertiary)',
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

  // The section is semantically an ordered list of prioritised actions —
  // the visible eyebrow "What to do, in order" communicates ordering to
  // sighted users; screen readers get the same signal via <ol>. aria-labelledby
  // ties the section to its eyebrow so AT announces "region: What to do, in
  // order" instead of just an anonymous list.
  const eyebrowId = 'action-list-eyebrow';

  return (
    <section className="py-6" aria-labelledby={eyebrowId}>
      {/* Section eyebrow */}
      <p
        id={eyebrowId}
        className="font-medium uppercase"
        style={{
          fontSize: '9px',
          letterSpacing: '2.5px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '16px',
        }}
      >
        What to do, in order
      </p>

      {/* list-none strips the default marker so the visual is unchanged;
          role is still list + listitem for AT. */}
      <ol className="list-none space-y-2 p-0">
        {sorted.map((action, i) => {
          const config = TIER_CONFIG[action.priority];
          return (
            <li key={i}>
              <article
                aria-label={`${config.label} — ${action.timeAnchor} — ${action.text}`}
                style={{
                  background: 'var(--color-background-primary)',
                  border: '1px solid var(--color-border-secondary)',
                  padding: '16px',
                  borderRadius: '8px',
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
                      color: '#1A6B5A',
                      letterSpacing: '0.3px',
                    }}
                  >
                    {action.timeAnchor}
                  </span>
                </div>

                {/* What — the instruction */}
                <p
                  className="font-medium"
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.5,
                    marginBottom: action.script || action.why ? '8px' : 0,
                  }}
                >
                  {action.text}
                </p>

                {/* Script — only when present. <blockquote> is the correct
                    element for a verbatim quote the merchant will read aloud. */}
                {action.script && (
                  <blockquote
                    style={{
                      background: '#FAF7F2',
                      borderLeft: '2px solid #72C4B0',
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                      margin: 0,
                      marginBottom: action.why ? '8px' : 0,
                      borderRadius: '8px',
                    }}
                  >
                    {action.script}
                  </blockquote>
                )}

                {/* Why — only when present */}
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
