'use client';

// Homepage "What you'll receive" scrollytelling preview.
// Replaces the legacy 4-tile situations grid (deleted April 2026).
//
// Renders a flat, front-facing mock of the results page that auto-cycles
// through 5 panels (P&L overview → Action plan → Negotiation brief →
// Customer templates → Readiness checklist). Hovering pauses the cycle.
//
// Panel bodies use static coloured skeleton bars (.sk-warm, .sk-red,
// .sk-em, .sk-amber + height variants) so the mock reads as a structural
// poster of what the merchant will get rather than promising specific
// numbers. Structural chrome — badges, metric labels, tab pills, dates,
// section headings — stays as live text.
//
// Constraint: the report renders flat. No CSS transform, perspective, or
// 3D effects.

import { useEffect, useRef, useState } from 'react';

// ─── Nav items (left column) ────────────────────────────────────────────────

interface NavItem {
  num: string;
  title: string;
  desc: string;
}

const NAV_ITEMS: NavItem[] = [
  { num: '01', title: 'Your exact P&L impact', desc: 'Dollar figure, not a percentage' },
  { num: '02', title: 'Prioritised action plan', desc: 'URGENT / PLAN / MONITOR with deadlines' },
  { num: '03', title: 'Your PSP negotiation script', desc: 'Exact words. Contact details.' },
  { num: '04', title: 'Customer communication', desc: 'Email, counter sign, social media' },
  { num: '05', title: 'Readiness checklist', desc: 'Dated milestones. Track progress.' },
];

// Active panel index → sidebar id that should be highlighted
const SIDEBAR_FOR_PANEL = ['overview', 'actions', 'negotiate', 'customers', 'checklist'] as const;

// ─── Sidebar groups (inside the report mock) ────────────────────────────────

interface SidebarItem {
  id: string;
  text: string;
  sub?: string;
  priceTag?: string;
}

const SIDEBAR_GROUPS: { label: string; items: SidebarItem[] }[] = [
  {
    label: 'RESULT',
    items: [
      { id: 'overview', text: 'Overview', sub: 'Verdict, metrics' },
      { id: 'actions', text: 'Actions', sub: 'Prioritised steps' },
    ],
  },
  {
    label: 'PREPARE',
    items: [
      { id: 'negotiate', text: 'Negotiation brief', sub: 'PSP call script' },
      { id: 'customers', text: 'Talk to customers' },
      { id: 'checklist', text: 'Readiness checklist' },
    ],
  },
  {
    label: 'UNDERSTAND',
    items: [
      { id: 'values', text: 'Values & rates' },
      { id: 'refine', text: 'Refine estimate' },
    ],
  },
  {
    label: 'NEXT STEP',
    items: [{ id: 'help', text: 'Get help', priceTag: '$3,500' }],
  },
];

// Skeleton bar — static coloured block, no animation. Width as a Tailwind
// class or inline style; height + colour from the predefined sk-* classes.
function Sk({
  colour,
  size,
  width,
  className,
}: {
  colour: 'warm' | 'red' | 'em' | 'amber';
  size: 'hero' | 'lg' | 'md' | 'sm' | 'xs';
  width?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`sk-${colour} sk-${size}${width ? ` ${width}` : ''}${className ? ` ${className}` : ''}`}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PreviewSection() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % NAV_ITEMS.length);
    }, 3500);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startInterval();
    return stopInterval;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSidebarId = SIDEBAR_FOR_PANEL[active];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#0F0D09', padding: '100px 0 120px' }}
    >
      {/* Ambient emerald glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '600px',
          height: '600px',
          background:
            'radial-gradient(ellipse at center, rgba(26,107,90,0.18) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        className="relative mx-auto flex flex-col gap-8 px-5 md:flex-row md:items-center md:gap-20 md:px-[60px]"
        style={{ maxWidth: '1240px', zIndex: 1 }}
      >
        {/* ─── LEFT COLUMN ─── */}
        <div className="w-full md:w-[240px] md:flex-shrink-0">
          <p
            className="uppercase"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '2px',
              color: '#1A6B5A',
              marginBottom: '12px',
            }}
          >
            What you&apos;ll receive
          </p>

          <h2
            className="font-serif"
            style={{
              fontSize: '32px',
              fontWeight: 500,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            A complete reform report.
            <br />
            <em style={{ fontStyle: 'italic', color: '#1A6B5A' }}>
              In four questions.
            </em>
          </h2>

          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.7,
              marginBottom: '36px',
            }}
          >
            Sample below — $3M hospitality, CommBank cost-plus, currently surcharging at 2.5%.
          </p>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_ITEMS.map((item, idx) => {
              const isActive = idx === active;
              const isLast = idx === NAV_ITEMS.length - 1;
              return (
                <li
                  key={item.num}
                  onClick={() => setActive(idx)}
                  className="group relative cursor-pointer"
                  style={{
                    padding: '14px 0',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                  }}
                >
                  {isActive && (
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '3px',
                        height: '70%',
                        background: '#1A6B5A',
                      }}
                    />
                  )}

                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '10px',
                        color: isActive ? '#1A6B5A' : 'rgba(255,255,255,0.2)',
                        flexShrink: 0,
                        transition: 'color 0.2s',
                      }}
                    >
                      {item.num}
                    </span>
                    <div className="flex-1">
                      <p
                        style={{
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                          transition: 'color 0.2s',
                        }}
                        className={!isActive ? 'group-hover:!text-white/60' : ''}
                      >
                        {item.title}
                      </p>
                      <p
                        className="hidden sm:block"
                        style={{
                          fontSize: '11px',
                          color: isActive
                            ? 'rgba(255,255,255,0.45)'
                            : 'rgba(255,255,255,0.2)',
                          marginTop: '2px',
                          transition: 'color 0.2s',
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#1A6B5A',
                        opacity: isActive ? 1 : 0,
                        transition: 'opacity 0.2s',
                        flexShrink: 0,
                      }}
                      aria-hidden
                    >
                      →
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <a
            href="/assessment"
            data-cta="preview"
            className="mt-10 inline-block transition-opacity hover:opacity-90"
            style={{
              background: '#1A6B5A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '100px',
              transition: 'opacity 0.15s',
            }}
          >
            Get my free report →
          </a>

          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              marginTop: '10px',
            }}
          >
            Your numbers will be different. 4 questions.
          </p>
        </div>

        {/* ─── RIGHT COLUMN — flat report mock ─── */}
        <div
          className="w-full md:flex-1"
          onMouseEnter={stopInterval}
          onMouseLeave={startInterval}
        >
          <div
            style={{
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                background: '#2A2520',
                padding: '8px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }} aria-hidden>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FF5F57' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FEBC2E' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#28C840' }} />
              </div>
              <span
                className="font-mono"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                  padding: '4px 10px',
                  borderRadius: '5px',
                }}
              >
                nosurcharging.com.au/results?id=sample
              </span>
            </div>

            {/* App top bar */}
            <div
              style={{
                background: '#141210',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                padding: '7px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                <em style={{ fontStyle: 'italic', color: '#1A6B5A' }}>no</em>
                surcharging.com.au
              </span>
              <span
                style={{
                  background: 'rgba(121,31,31,0.35)',
                  border: '1px solid rgba(121,31,31,0.5)',
                  color: '#E57373',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  padding: '2px 7px',
                  borderRadius: '20px',
                }}
              >
                SITUATION 3
              </span>
              <Sk colour="red" size="lg" width="w-[80px]" />
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                Accuracy ▪ 20%
              </span>
              <span
                style={{
                  background: '#1A6B5A',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '100px',
                }}
              >
                Get help · $3,500
              </span>
            </div>

            {/* Report body */}
            <div className="flex" style={{ background: '#FAF7F2' }}>
              {/* Sidebar */}
              <aside
                style={{
                  width: '138px',
                  flexShrink: 0,
                  background: '#F0EBE3',
                  borderRight: '0.5px solid #DDD5C8',
                  padding: '14px 10px',
                }}
              >
                {SIDEBAR_GROUPS.map((group, gi) => (
                  <div key={group.label} style={{ marginTop: gi === 0 ? 0 : '12px' }}>
                    <p
                      style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        color: '#9A8C78',
                        marginBottom: '6px',
                      }}
                    >
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const isActiveItem = item.id === activeSidebarId;
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: isActiveItem ? '#EBF6F3' : 'transparent',
                            borderLeft: isActiveItem
                              ? '2.5px solid #1A6B5A'
                              : '2.5px solid transparent',
                            borderRadius: '3px',
                            marginBottom: '2px',
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: '10.5px',
                                color: isActiveItem ? '#0D3D32' : '#1A1409',
                                fontWeight: isActiveItem ? 700 : 500,
                              }}
                            >
                              {item.text}
                            </p>
                            {item.sub && (
                              <p
                                style={{
                                  fontSize: '8.5px',
                                  color: '#9A8C78',
                                  marginTop: '1px',
                                }}
                              >
                                {item.sub}
                              </p>
                            )}
                          </div>
                          {item.priceTag && (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: '#1A6B5A',
                              }}
                            >
                              {item.priceTag}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </aside>

              {/* Main content area */}
              <div
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  overflow: 'hidden',
                  minHeight: '420px',
                }}
              >
                {active === 0 && <PanelOverview />}
                {active === 1 && <PanelActions />}
                {active === 2 && <PanelNegotiation />}
                {active === 3 && <PanelCustomers />}
                {active === 4 && <PanelChecklist />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Panels ─────────────────────────────────────────────────────────────────

function PanelOverview() {
  return (
    <div className="space-y-2">
      <span
        style={{
          background: '#FCEBEB',
          color: '#791F1F',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-block',
        }}
      >
        SITUATION 3 · ESTIMATED · RBA AVERAGES
      </span>

      {/* Headline → skeleton */}
      <Sk colour="warm" size="md" width="w-3/4" className="mt-2" />

      {/* Hero number → red sk-hero, narrower */}
      <Sk colour="red" size="hero" width="w-[140px]" className="mt-2" />

      {/* Sub-line + daily anchor + context */}
      <Sk colour="warm" size="sm" width="w-2/3" />
      <Sk colour="warm" size="sm" width="w-1/2" />
      <Sk colour="warm" size="xs" width="w-3/5" />

      {/* 2x2 metric grid */}
      <div className="grid grid-cols-2" style={{ gap: '6px', marginTop: '12px' }}>
        <MetricCard label="INTERCHANGE SAVING" valueColour="em" />
        <MetricCard label="NET P&L IMPACT" valueColour="red" />
        <MetricCard label="SURCHARGE REVENUE" valueColour="red" />
        <MetricCard label="YOUR COST TODAY" valueColour="warm" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  valueColour,
}: {
  label: string;
  valueColour: 'warm' | 'red' | 'em' | 'amber';
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #DDD5C8',
        borderRadius: '7px',
        padding: '9px 11px',
      }}
    >
      <p
        style={{
          fontSize: '7.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 700,
          color: '#9A8C78',
          marginBottom: '6px',
        }}
      >
        {label}
      </p>
      <Sk colour={valueColour} size="lg" width="w-3/4" />
      <Sk colour="warm" size="xs" width="w-1/2" className="mt-1.5" />
    </div>
  );
}

function PanelActions() {
  return (
    <div>
      <p
        style={{
          fontSize: '8.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 700,
          color: '#9A8C78',
          borderBottom: '0.5px solid #DDD5C8',
          paddingBottom: '6px',
          marginBottom: '8px',
        }}
      >
        Your action plan — what to do, in order
      </p>

      <ActionItem
        priority="URGENT"
        priorityColor="#791F1F"
        deadline="Before 1 July 2026"
        skColour="red"
        showScript
      />
      <ActionItem
        priority="PLAN"
        priorityColor="#BA7517"
        deadline="Before 1 August 2026"
        skColour="amber"
        showScript
      />
      <ActionItem
        priority="MONITOR"
        priorityColor="#1A6B5A"
        deadline="From 1 October 2026"
        skColour="em"
      />
    </div>
  );
}

function ActionItem({
  priority,
  priorityColor,
  deadline,
  skColour,
  showScript,
}: {
  priority: string;
  priorityColor: string;
  deadline: string;
  skColour: 'warm' | 'red' | 'em' | 'amber';
  showScript?: boolean;
}) {
  return (
    <div
      style={{
        borderLeft: `2.5px solid ${priorityColor}`,
        background: '#F5F1EA',
        borderRadius: '0 6px 6px 0',
        padding: '7px 10px',
        marginBottom: '6px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            color: priorityColor,
            letterSpacing: '0.5px',
          }}
        >
          {priority}
        </span>
        <span style={{ fontSize: '8px', color: '#9A8C78' }}>· {deadline}</span>
      </div>
      {/* Title → 2-line skeleton */}
      <Sk colour={skColour} size="md" width="w-full" className="mt-2" />
      <Sk colour={skColour} size="md" width="w-2/3" className="mt-1.5" />
      {showScript && (
        <div
          style={{
            background: '#FFFFFF',
            borderLeft: '2px solid #72C4B0',
            padding: '6px 8px',
            marginTop: '6px',
            borderRadius: '0 3px 3px 0',
          }}
        >
          <Sk colour="warm" size="sm" width="w-full" />
          <Sk colour="warm" size="sm" width="w-11/12" className="mt-1.5" />
          <Sk colour="warm" size="sm" width="w-3/4" className="mt-1.5" />
        </div>
      )}
    </div>
  );
}

function PanelNegotiation() {
  return (
    <div>
      <div
        style={{
          background: '#EBF6F3',
          borderRadius: '7px',
          padding: '10px 12px',
          marginBottom: '8px',
        }}
      >
        <p
          style={{
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 700,
            color: '#0D3D32',
            marginBottom: '6px',
          }}
        >
          Negotiation Brief — CommBank
        </p>
        <Sk colour="em" size="sm" width="w-3/4" />
      </div>

      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#1A1409',
          marginBottom: '10px',
        }}
      >
        Use this script on the call:
      </p>

      <div
        style={{
          background: '#FFFFFF',
          padding: '8px 10px',
          borderRadius: '5px',
        }}
      >
        <Sk colour="em" size="sm" width="w-full" />
        <Sk colour="em" size="sm" width="w-11/12" className="mt-1.5" />
        <Sk colour="em" size="sm" width="w-full" className="mt-1.5" />
        <Sk colour="em" size="sm" width="w-4/5" className="mt-1.5" />
        <Sk colour="em" size="sm" width="w-2/3" className="mt-1.5" />
      </div>

      <div className="mt-3">
        <Sk colour="warm" size="sm" width="w-full" />
        <Sk colour="warm" size="sm" width="w-3/4" className="mt-1.5" />
      </div>
    </div>
  );
}

function PanelCustomers() {
  return (
    <div>
      <h3
        style={{
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '10px',
          color: '#1A1409',
        }}
      >
        Customer communication templates
      </h3>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <span
          style={{
            background: '#1A6B5A',
            color: '#FFFFFF',
            fontSize: '9px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '100px',
          }}
        >
          Customer email
        </span>
        <span
          style={{
            border: '0.5px solid #DDD5C8',
            color: '#6B5E4A',
            fontSize: '9px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '100px',
          }}
        >
          Counter sign
        </span>
        <span
          style={{
            border: '0.5px solid #DDD5C8',
            color: '#6B5E4A',
            fontSize: '9px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '100px',
          }}
        >
          Social media
        </span>
      </div>

      <div
        style={{
          border: '0.5px solid #DDD5C8',
          borderRadius: '7px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: '#F5F1EA',
            padding: '10px 14px',
            borderBottom: '0.5px solid #DDD5C8',
          }}
        >
          <div className="flex items-center gap-2" style={{ marginBottom: '5px' }}>
            <span style={{ fontSize: '9px', color: '#9A8C78' }}>To:</span>
            <Sk colour="warm" size="sm" width="w-1/3" />
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '9px', color: '#9A8C78' }}>Subject:</span>
            <Sk colour="warm" size="sm" width="w-2/3" />
          </div>
        </div>
        <div style={{ padding: '14px' }}>
          <Sk colour="warm" size="sm" width="w-1/3" />
          <Sk colour="warm" size="sm" width="w-full" className="mt-2" />
          <Sk colour="warm" size="sm" width="w-11/12" className="mt-1.5" />
          <Sk colour="warm" size="sm" width="w-full" className="mt-1.5" />
          <Sk colour="warm" size="sm" width="w-3/4" className="mt-1.5" />
          <Sk colour="warm" size="sm" width="w-2/3" className="mt-3" />
          <Sk colour="warm" size="sm" width="w-full" className="mt-1.5" />
          <Sk colour="warm" size="sm" width="w-5/6" className="mt-1.5" />
        </div>
      </div>
    </div>
  );
}

function PanelChecklist() {
  const dates = [
    'By 30 June 2026',
    'By 31 August 2026',
    'By 30 September 2026',
    'By 30 November 2026',
  ];
  return (
    <div>
      <h3
        style={{
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '12px',
          color: '#1A1409',
        }}
      >
        Readiness checklist — track your progress
      </h3>

      {dates.map((date, idx) => {
        const isLast = idx === dates.length - 1;
        return (
          <div
            key={date}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#FFFFFF',
              border: '0.5px solid #DDD5C8',
              borderRadius: '7px',
              padding: '10px 14px',
              marginBottom: '7px',
            }}
          >
            <div
              aria-hidden
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: isLast ? '1.5px solid #1A6B5A' : '1.5px solid #DDD5C8',
                background: isLast ? '#EBF6F3' : 'transparent',
                flexShrink: 0,
              }}
            />
            <div className="flex-1">
              {/* Title → skeleton */}
              <Sk colour="warm" size="md" width={idx === 0 ? 'w-3/4' : idx === 1 ? 'w-1/2' : idx === 2 ? 'w-2/3' : 'w-3/5'} />
              <p
                className="font-mono"
                style={{
                  fontSize: '9px',
                  color: '#9A8C78',
                  marginTop: '4px',
                }}
              >
                · {date}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
