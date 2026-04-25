'use client';

import { forwardRef, useState, useEffect, useCallback } from 'react';
import { SubTabStrip } from '@/components/results/SubTabStrip';
import { PSPRateRegistry } from '@/components/results/PSPRateRegistry';
import { getRegistryCount, getRegistryBenchmarks } from '@/actions/getRegistryData';
import type { BenchmarkRow } from '@/actions/getRegistryData';

interface PSPRegistrySectionProps {
  assessmentId: string;
  pspName: string;
  planType: 'flat' | 'costplus';
  volume: number;
  category: 1 | 2 | 3 | 4;
  industry: string;
}

const TABS = [
  { key: 'contribute', label: 'Contribute your rate' },
  { key: 'benchmark', label: 'See the benchmark' },
  { key: 'how', label: 'How it works' },
];

const GOAL = 1000;

export const PSPRegistrySection = forwardRef<HTMLElement, PSPRegistrySectionProps>(
  function PSPRegistrySection(props, ref) {
    const { assessmentId, pspName, planType, volume, industry } = props;

    const [activeTab, setActiveTab] = useState('contribute');
    const [count, setCount] = useState<number | null>(null);
    const [benchmarks, setBenchmarks] = useState<BenchmarkRow[] | null>(null);
    const [benchmarkLoaded, setBenchmarkLoaded] = useState(false);
    const [contributed, setContributed] = useState(false);

    // Fetch count on mount
    useEffect(() => {
      getRegistryCount().then(setCount);
    }, []);

    // Fetch benchmarks on first tab 2 click
    const handleTabChange = useCallback(
      (key: string) => {
        setActiveTab(key);
        if (key === 'benchmark' && !benchmarkLoaded) {
          setBenchmarkLoaded(true);
          getRegistryBenchmarks(pspName, planType).then(setBenchmarks);
        }
      },
      [benchmarkLoaded, pspName, planType],
    );

    const handleContributed = () => {
      setContributed(true);
      // Increment local count optimistically
      setCount((prev) => (prev != null ? prev + 1 : 1));
    };

    const progressPct = count != null ? Math.min((count / GOAL) * 100, 100) : 0;

    return (
      <section id="registry" data-section="registry" ref={ref} className="pt-8">
        {/* Eyebrow */}
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Community
        </p>

        {/* Hero card — dark background */}
        <div style={{ background: '#1A1409', padding: '24px' }}>
          <p
            className="uppercase font-medium"
            style={{
              fontSize: '11px',
              letterSpacing: '1.5px',
              color: 'rgba(255, 255, 255, 0.4)',
              marginBottom: '10px',
            }}
          >
            PSP Rate Registry
          </p>

          <h3
            className="font-serif font-medium"
            style={{
              fontSize: '17px',
              color: '#FFFFFF',
              lineHeight: 1.45,
              marginBottom: '16px',
            }}
          >
            Help build the only independent Australian merchant rate database
          </h3>

          {/* Live counter + progress bar */}
          <div style={{ marginBottom: '20px' }}>
            <p
              className="font-mono"
              style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '6px' }}
            >
              {count != null ? (
                <>
                  <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{count.toLocaleString('en-AU')}</span>{' '}
                  rates contributed
                </>
              ) : (
                'Building...'
              )}
            </p>
            <div
              style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                data-testid="progress-bar"
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: 'var(--color-accent)',
                  borderRadius: '2px',
                  transition: 'width 300ms ease',
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.25)', marginTop: '4px' }}>
              Goal: {GOAL.toLocaleString('en-AU')} rates
            </p>
          </div>

          {/* Value exchange strip */}
          <div
            className="grid grid-cols-3 gap-4"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
            }}
          >
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                You contribute
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Your effective rate (anonymous)
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                You get back
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                See how your rate compares
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                On 30 October
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Australia&apos;s first benchmark report
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed body — white card */}
        <div
          className="mt-4"
          style={{
            background: '#FFFFFF',
            border: '0.5px solid var(--color-border-tertiary)',
            padding: '20px',
          }}
        >
          <SubTabStrip tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

          <div className="mt-5">
            {activeTab === 'contribute' && (
              <PSPRateRegistry
                assessmentId={assessmentId}
                pspName={pspName}
                planType={planType}
                volume={volume}
                industry={industry}
                onContributed={handleContributed}
              />
            )}

            {activeTab === 'benchmark' && (
              <BenchmarkTab
                benchmarks={benchmarks}
                contributed={contributed}
              />
            )}

            {activeTab === 'how' && <HowItWorksTab />}
          </div>
        </div>
      </section>
    );
  },
);

/* ── Benchmark tab ────────────────────────────────────────────── */

function BenchmarkTab({
  benchmarks,
  contributed,
}: {
  benchmarks: BenchmarkRow[] | null;
  contributed: boolean;
}) {
  if (benchmarks === null) {
    return (
      <p className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Loading benchmarks...
      </p>
    );
  }

  if (benchmarks.length === 0) {
    return (
      <div>
        <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Not enough data yet
        </p>
        <p className="text-caption mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {contributed
            ? "You're one of the first — check back as more merchants contribute."
            : 'Contribute your rate to help unlock benchmarks for everyone.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--color-border-secondary)',
              color: 'var(--color-text-tertiary)',
              fontSize: '11px',
            }}
          >
            <th className="text-left py-2 font-medium">PSP</th>
            <th className="text-left py-2 font-medium">Plan</th>
            <th className="text-left py-2 font-medium">Volume</th>
            <th className="text-right py-2 font-medium">Entries</th>
            <th className="text-right py-2 font-mono font-medium">Median</th>
            <th className="text-right py-2 font-mono font-medium">Range</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}
            >
              <td className="py-2">{row.psp_name}</td>
              <td className="py-2">{row.plan_type === 'flat' ? 'Flat' : 'Cost+'}</td>
              <td className="py-2">{row.volume_band}</td>
              <td className="text-right py-2 font-mono">{row.entry_count}</td>
              <td className="text-right py-2 font-mono">
                {(row.median_rate * 100).toFixed(2)}%
              </td>
              <td className="text-right py-2 font-mono">
                {(row.min_rate * 100).toFixed(2)}–{(row.max_rate * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── How it works tab ─────────────────────────────────────────── */

function HowItWorksTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          What we collect
        </p>
        <ul className="mt-1 text-body-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <li>Your PSP name, plan type, and effective rate</li>
          <li>Volume band and industry (optional)</li>
          <li>State (optional)</li>
        </ul>
      </div>
      <div>
        <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          What we never collect
        </p>
        <ul className="mt-1 text-body-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <li>Your business name or ABN</li>
          <li>Your email (unless you opt in separately)</li>
          <li>Your exact transaction volume</li>
        </ul>
      </div>
      <div>
        <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          How benchmarks work
        </p>
        <p className="mt-1 text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
          We only show aggregated data when a segment has 5 or more contributions.
          Individual rates are never displayed. Your contribution is completely anonymous
          and is never shared with any payment provider.
        </p>
      </div>
    </div>
  );
}
