'use client';

// VerticalActionSteps — Ruthless Cut M2 visual restyle.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §5: vertical hairline +
// tier-coloured numbered dots; tier headers in small-caps coloured by
// tier; "Exact script" left-bordered light-bg block; `why` as small
// grey text below. The wrapper white-card per-step border is gone.
//
// Scripts are collapsed by default (user selected). Each step renders
// title + why + (if framework) RAO grid by default; the chevron toggle
// reveals the "Exact script" block. Why stays visible because it's the
// fastest read; framework stays visible because it IS the value of the
// step it belongs to.

import { useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  CircleAlert,
  Clock,
  Eye,
  RefreshCcw,
  Settings2,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { ReactNode } from 'react';
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

const PRIORITY_ICON: Record<ActionPriority | 'deadline', ReactNode> = {
  urgent: <CircleAlert size={10} aria-hidden />,
  plan: <Clock size={10} aria-hidden />,
  monitor: <Eye size={10} aria-hidden />,
  deadline: <CalendarDays size={10} aria-hidden />,
};

// Tier-coloured small-caps header (URGENT / PLAN / MONITOR / DEADLINE).
// Sits above the title in place of the previous coloured-pill badge.
function TierHeader({ priority }: { priority: ActionPriority | 'deadline' }) {
  const label =
    priority === 'deadline' ? 'DEADLINE' : PRIORITY_LABEL[priority];
  const colour =
    priority === 'urgent'
      ? 'var(--color-text-danger)'
      : priority === 'plan'
        ? 'var(--color-text-warning)'
        : priority === 'deadline'
          ? 'var(--color-text-primary)'
          : 'var(--color-text-tertiary)';
  return (
    <span
      className="inline-flex items-center font-bold uppercase"
      style={{
        gap: '5px',
        fontSize: '9px',
        letterSpacing: '0.8px',
        color: colour,
      }}
    >
      {PRIORITY_ICON[priority]}
      {label}
    </span>
  );
}

function StepDot({
  priority,
  content,
}: {
  priority: ActionPriority | 'deadline';
  content: ReactNode;
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

const RAO_LEVER_ICON: Record<'R' | 'A' | 'O', ReactNode> = {
  R: <RefreshCcw size={12} aria-hidden />,
  A: <ShieldCheck size={12} aria-hidden />,
  O: <Settings2 size={12} aria-hidden />,
};

function RaoCard({ framework }: { framework: RaoFramework }) {
  return (
    <div
      style={{
        background: 'var(--color-background-secondary)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginTop: '10px',
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
                  className="inline-flex items-center font-bold"
                  style={{
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ color: styles.color }}>
                    {RAO_LEVER_ICON[lever.letter]}
                  </span>
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
                    <Target size={11} aria-hidden />
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

interface StepRowProps {
  number: number | string;
  priority: ActionPriority | 'deadline';
  timeAnchor: string;
  title: string;
  script?: string;
  why?: string;
  framework?: RaoFramework;
  isLast?: boolean;
}

function StepRow({
  number,
  priority,
  timeAnchor,
  title,
  script,
  why,
  framework,
  isLast,
}: StepRowProps) {
  // Scripts collapse by default (per Manu's M2 decision). The chevron
  // toggle reveals the "Exact script" block below. Why + framework stay
  // visible because they're the fastest read / load-bearing content.
  const [scriptOpen, setScriptOpen] = useState(false);
  const hasScript = !!script;

  return (
    <div className="flex relative" style={{ gap: '14px' }}>
      {/* Vertical connector line — drawn behind the dot, anchored to
          the dot column so it never crosses the body content. */}
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
      <div className="flex-1" style={{ paddingBottom: '24px' }}>
        {/* Tier header + date row */}
        <div
          className="flex items-center"
          style={{ gap: '8px', marginBottom: '6px', paddingTop: '6px' }}
        >
          <TierHeader priority={priority} />
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

        {/* Title */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color:
              priority === 'deadline'
                ? 'var(--color-text-tertiary)'
                : 'var(--color-text-primary)',
            lineHeight: 1.45,
            marginBottom: why || framework || hasScript ? '8px' : 0,
          }}
        >
          {title}
        </h3>

        {/* Why — small grey, sits below title (always visible) */}
        {why && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.6,
            }}
          >
            {why}
          </p>
        )}

        {/* Framework — Cat 3/4 RAO card, always visible (it IS the value) */}
        {framework && <RaoCard framework={framework} />}

        {/* Exact script — collapses by default */}
        {hasScript && (
          <div style={{ marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setScriptOpen((v) => !v)}
              className="inline-flex items-center font-bold uppercase cursor-pointer"
              aria-expanded={scriptOpen}
              style={{
                gap: '5px',
                fontSize: '10px',
                letterSpacing: '0.5px',
                color: 'var(--color-text-tertiary)',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <ChevronDown
                size={11}
                aria-hidden
                style={{
                  transition: 'transform 0.2s',
                  transform: scriptOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
              {scriptOpen ? 'Hide script' : 'Show exact script'}
            </button>

            {scriptOpen && (
              <div style={{ marginTop: '8px' }}>
                <p
                  className="font-bold uppercase"
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.5px',
                    color: 'var(--color-text-tertiary)',
                    marginBottom: '6px',
                  }}
                >
                  Exact script
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.7,
                    fontStyle: 'italic',
                    background: 'var(--color-background-secondary)',
                    borderLeft: '2px solid var(--color-accent-border)',
                    padding: '12px 14px',
                    borderRadius: '0 8px 8px 0',
                  }}
                >
                  {script}
                </p>
              </div>
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

  const countParts: string[] = [];
  if (urgentCount > 0) countParts.push(`${urgentCount} urgent`);
  if (planCount > 0) countParts.push(`${planCount} plan`);
  if (monitorCount > 0) countParts.push(`${monitorCount} monitor`);
  const countText = countParts.join(' · ');

  return (
    <section aria-labelledby={eyebrowId} className="px-5 md:px-8">
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ gap: '10px', marginBottom: '20px' }}
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

      <div style={{ position: 'relative' }}>
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
