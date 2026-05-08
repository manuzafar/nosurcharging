'use client';

// VerticalActionSteps — Results_V2 redesign replacement for ActionList.
// Each action becomes a numbered step on a vertical timeline:
//   • Coloured numbered dot (urgent red / plan amber / monitor neutral)
//   • Vertical connector line through the dot column
//   • Step body: priority badge + date + title + white card with script | RAO | why
//
// Cat 3 / Cat 4 action 2 carries `framework` (RaoFramework) instead of `script`.
// We render a structured RAO card (R / A / O letter dots + condition + optional
// break-even pill) so the lever copy is single-source-of-truth in actions.ts —
// not embedded in script text.
//
// A trailing DEADLINE marker (1 OCTOBER 2026) is appended below the steps to
// anchor the timeline visually.

import type {
  ActionItem,
  ActionPriority,
  RaoFramework,
} from '@nosurcharging/calculations/types';

interface VerticalActionStepsProps {
  actions: ActionItem[];
}

const TIER_ORDER: ActionPriority[] = ['urgent', 'plan', 'monitor'];

function sortByTier(actions: ActionItem[]): ActionItem[] {
  return [...actions].sort(
    (a, b) => TIER_ORDER.indexOf(a.priority) - TIER_ORDER.indexOf(b.priority),
  );
}

interface DotStyles {
  bg: string;
  color: string;
  ring: string | null;
  border: string | null;
}

function dotStyles(priority: ActionPriority | 'deadline'): DotStyles {
  switch (priority) {
    case 'urgent':
      return {
        bg: 'var(--color-text-danger)',
        color: '#FFFFFF',
        ring: 'var(--color-background-danger)',
        border: null,
      };
    case 'plan':
      return {
        bg: 'var(--color-text-warning)',
        color: '#FFFFFF',
        ring: 'var(--color-background-warning)',
        border: null,
      };
    case 'monitor':
      return {
        bg: 'var(--color-background-secondary)',
        color: 'var(--color-text-tertiary)',
        ring: null,
        border: 'var(--color-border-secondary)',
      };
    case 'deadline':
      return {
        bg: 'var(--color-text-primary)',
        color: '#FFFFFF',
        ring: null,
        border: null,
      };
  }
}

const PRIORITY_LABEL: Record<ActionPriority, string> = {
  urgent: 'URGENT',
  plan: 'PLAN',
  monitor: 'MONITOR',
};

function PriorityBadge({ priority }: { priority: ActionPriority | 'deadline' }) {
  const styles = dotStyles(priority);
  const label = priority === 'deadline' ? 'DEADLINE' : PRIORITY_LABEL[priority];
  return (
    <span
      className="font-bold uppercase"
      style={{
        fontSize: '8px',
        letterSpacing: '0.3px',
        padding: '2px 8px',
        borderRadius: '3px',
        background: styles.bg,
        color: styles.color,
        border: styles.border ? `0.5px solid ${styles.border}` : 'none',
      }}
    >
      {label}
    </span>
  );
}

function StepDot({
  priority,
  content,
}: {
  priority: ActionPriority | 'deadline';
  content: React.ReactNode;
}) {
  const styles = dotStyles(priority);
  return (
    <div
      className="flex items-center justify-center font-bold"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: styles.bg,
        color: styles.color,
        fontSize: priority === 'deadline' ? '9px' : '11px',
        fontWeight: priority === 'deadline' ? 800 : 700,
        boxShadow: styles.ring ? `0 0 0 4px ${styles.ring}` : 'none',
        border: styles.border ? `0.5px solid ${styles.border}` : 'none',
      }}
    >
      {content}
    </div>
  );
}

// ── RAO framework card ──────────────────────────────────────────

function RaoLeverDotStyles(letter: 'R' | 'A' | 'O'): {
  bg: string;
  color: string;
  border: string | null;
} {
  switch (letter) {
    case 'R':
      return {
        bg: 'var(--color-background-warning)',
        color: 'var(--color-text-warning)',
        border: null,
      };
    case 'A':
      return {
        bg: 'var(--color-background-success)',
        color: 'var(--color-text-success)',
        border: null,
      };
    case 'O':
      return {
        bg: 'var(--color-background-primary)',
        color: 'var(--color-text-secondary)',
        border: 'var(--color-border-secondary)',
      };
  }
}

function RaoCard({ framework }: { framework: RaoFramework }) {
  return (
    <div
      style={{
        background: 'var(--color-background-secondary)',
        borderRadius: '10px',
        padding: '16px',
        marginTop: '6px',
      }}
    >
      <p
        className="font-bold"
        style={{
          fontSize: '11px',
          color: 'var(--color-text-primary)',
          marginBottom: '12px',
        }}
      >
        {framework.title}
      </p>

      <div className="flex flex-col" style={{ gap: '10px' }}>
        {framework.levers.map((lever) => {
          const styles = RaoLeverDotStyles(lever.letter);
          return (
            <div
              key={lever.letter}
              className="flex items-start"
              style={{ gap: '10px' }}
            >
              <span
                className="flex items-center justify-center shrink-0 font-bold"
                aria-hidden
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: styles.bg,
                  color: styles.color,
                  border: styles.border ? `0.5px solid ${styles.border}` : 'none',
                  fontSize: '9px',
                  marginTop: '1px',
                }}
              >
                {lever.letter}
              </span>
              <div className="flex-1">
                <p
                  className="font-bold"
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {lever.name}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.55,
                  }}
                >
                  {lever.condition}
                </p>
                {lever.pill && (
                  <span
                    className="inline-flex items-center font-medium"
                    style={{
                      gap: '5px',
                      background: 'var(--color-background-success)',
                      border: '0.5px solid var(--color-text-success)',
                      color: 'var(--color-text-success)',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      marginTop: '8px',
                    }}
                  >
                    {lever.pill.label}: {lever.pill.value}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step row ────────────────────────────────────────────────────

function StepRow({
  number,
  priority,
  timeAnchor,
  title,
  script,
  why,
  framework,
  isLast,
}: {
  number: number | string;
  priority: ActionPriority | 'deadline';
  timeAnchor: string;
  title: string;
  script?: string;
  why?: string;
  framework?: RaoFramework;
  isLast?: boolean;
}) {
  const hasCard = !!script || !!why || !!framework;

  return (
    <div className="flex relative" style={{ gap: '14px', paddingBottom: '4px' }}>
      {/* Vertical connector line — drawn behind the dot */}
      {!isLast && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '15px',
            top: '32px',
            bottom: 0,
            width: '1.5px',
            background: 'var(--color-border-secondary)',
            zIndex: 0,
          }}
        />
      )}

      {/* Dot column */}
      <div
        className="shrink-0 relative"
        style={{ width: '32px', height: '32px', zIndex: 1 }}
      >
        <StepDot priority={priority} content={number} />
      </div>

      {/* Body */}
      <div className="flex-1" style={{ paddingBottom: '20px' }}>
        <div
          className="flex items-center"
          style={{ gap: '8px', marginBottom: '5px', paddingTop: '6px' }}
        >
          <PriorityBadge priority={priority} />
          <span
            className="font-medium"
            style={{
              fontSize: '10px',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {timeAnchor}
          </span>
        </div>

        <h3
          className="font-bold"
          style={{
            fontSize: '13px',
            color:
              priority === 'deadline'
                ? 'var(--color-text-tertiary)'
                : 'var(--color-text-primary)',
            lineHeight: 1.4,
            marginBottom: hasCard ? '6px' : 0,
          }}
        >
          {title}
        </h3>

        {hasCard && (
          <div
            style={{
              background: '#FFFFFF',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: '10px',
              padding: '14px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            {script && (
              <>
                <p
                  className="font-bold uppercase"
                  style={{
                    fontSize: '8.5px',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-tertiary)',
                    marginBottom: '8px',
                  }}
                >
                  Exact script
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                    borderLeft: '2px solid var(--color-accent-border)',
                    paddingLeft: '10px',
                    fontStyle: 'italic',
                    marginBottom: framework || why ? '8px' : 0,
                  }}
                >
                  {script}
                </p>
              </>
            )}

            {framework && <RaoCard framework={framework} />}

            {why && (
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 1.6,
                  marginTop: framework || script ? '10px' : 0,
                }}
              >
                {why}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Public component ────────────────────────────────────────────

export function VerticalActionSteps({ actions }: VerticalActionStepsProps) {
  const sorted = sortByTier(actions);
  const urgentCount = actions.filter((a) => a.priority === 'urgent').length;
  const planCount = actions.filter((a) => a.priority === 'plan').length;
  const monitorCount = actions.filter((a) => a.priority === 'monitor').length;

  const eyebrowId = 'action-list-eyebrow';

  // Counter pill text — only include non-zero buckets.
  const countParts: string[] = [];
  if (urgentCount > 0) countParts.push(`${urgentCount} urgent`);
  if (planCount > 0) countParts.push(`${planCount} plan`);
  if (monitorCount > 0) countParts.push(`${monitorCount} monitor`);
  const countText = countParts.join(' · ');

  return (
    <section aria-labelledby={eyebrowId}>
      {/* Header — title + count pill */}
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ gap: '10px', marginBottom: '16px', maxWidth: '700px' }}
      >
        <p
          id={eyebrowId}
          className="font-bold uppercase"
          style={{
            fontSize: '12px',
            letterSpacing: '0.8px',
            color: 'var(--color-text-primary)',
          }}
        >
          What to do, in order
        </p>
        {countText && (
          <span
            className="font-medium"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-danger)',
              background: 'var(--color-background-danger)',
              padding: '3px 10px',
              borderRadius: '100px',
            }}
          >
            {countText}
          </span>
        )}
      </div>

      {/* Vertical timeline */}
      <div style={{ maxWidth: '700px', position: 'relative' }}>
        {sorted.map((action, i) => (
          <StepRow
            key={i}
            number={i + 1}
            priority={action.priority}
            timeAnchor={action.timeAnchor}
            title={action.text}
            script={action.script}
            why={action.why}
            framework={action.framework}
          />
        ))}

        {/* Trailing deadline marker */}
        <StepRow
          number="OCT"
          priority="deadline"
          timeAnchor="1 OCTOBER 2026"
          title="Reform takes effect — surcharge ban applies"
          isLast
        />
      </div>
    </section>
  );
}
