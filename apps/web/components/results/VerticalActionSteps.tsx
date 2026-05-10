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

// RAO inline mini-grid — 3 tiles side by side per the editorial brief
// §"RAO framework — inline mini-grid". On ≤500px the 3 tiles wrap to
// 2 columns; the third spans both columns so the layout still reads as
// a coherent set rather than an orphan tile. Each tile is a small
// secondary-bg block carrying letter dot + name + condition; the
// break-even pill (RECOVER only) sits inside the tile, not below.
function RaoCard({ framework }: { framework: RaoFramework }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <p
        className="uppercase"
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: 'var(--color-text-tertiary)',
          marginBottom: '10px',
        }}
      >
        {framework.title}
      </p>

      <div
        // Mobile: 2 columns; the last (third) tile spans both via the
        // `last:[grid-column:span_2]` arbitrary class. Desktop: 3 cols.
        className="grid grid-cols-2 min-[501px]:grid-cols-3"
        style={{ gap: '8px' }}
      >
        {framework.levers.map((lever, idx) => {
          const styles = RaoLeverDotStyles(lever.letter);
          const isLast = idx === framework.levers.length - 1;
          return (
            <div
              key={lever.letter}
              // Last tile spans both columns on mobile only (501px is the
              // single project breakpoint). Desktop has its own 3-col
              // grid so no spanning needed.
              className={
                isLast
                  ? 'col-span-2 min-[501px]:col-span-1'
                  : 'col-span-1'
              }
              style={{
                background: 'var(--color-background-secondary)',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                className="flex items-center"
                style={{ gap: '8px' }}
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  aria-hidden
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: styles.bg,
                    color: styles.color,
                    border: styles.border
                      ? `0.5px solid ${styles.border}`
                      : 'none',
                    fontSize: '9px',
                    fontWeight: 500,
                  }}
                >
                  {lever.letter}
                </span>
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span style={{ color: styles.color }}>
                    {RAO_LEVER_ICON[lever.letter]}
                  </span>
                  {lever.name}
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {lever.condition}
              </p>
              {lever.pill && (
                <span
                  className="inline-flex items-center self-start"
                  style={{
                    gap: '5px',
                    background: 'var(--color-background-success)',
                    border: '0.5px solid var(--color-text-success)',
                    color: 'var(--color-text-success)',
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: '100px',
                  }}
                >
                  <Target size={11} aria-hidden />
                  {lever.pill.value}
                </span>
              )}
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
    // Editorial spacing per brief §"Action list overhaul": ~36px content
    // padding-left, lighter 1px connector (was 1.5px) coloured tertiary
    // border. Numbered 32×32 dots stay (PB-3) because the digit IS the
    // sequence cue.
    <div className="flex relative" style={{ gap: '16px' }}>
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
            width: '1px',
            background: 'var(--color-border-tertiary)',
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
      <div className="flex-1" style={{ paddingBottom: '28px' }}>
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

// Compute the urgent/plan/monitor count text for the SectionHeader
// meta in page.tsx. Exported so the page can render the meta without
// duplicating the priority-counting logic.
export function actionCountText(actions: ActionItem[]): string {
  const urgent = actions.filter((a) => a.priority === 'urgent').length;
  const plan = actions.filter((a) => a.priority === 'plan').length;
  const monitor = actions.filter((a) => a.priority === 'monitor').length;
  const parts: string[] = [];
  if (urgent > 0) parts.push(`${urgent} urgent`);
  if (plan > 0) parts.push(`${plan} plan`);
  if (monitor > 0) parts.push(`${monitor} monitor`);
  return parts.join(' · ');
}

// ── Public component ────────────────────────────────────────────

export function VerticalActionSteps({ actions }: VerticalActionStepsProps) {
  const sorted = sortByTier(actions);

  // Eyebrow + count pill moved out to the page-level SectionHeader.
  // The `actionCountText()` helper above feeds the SectionHeader meta.
  return (
    <section aria-label="Action plan steps" className="px-5 min-[501px]:px-8">

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
