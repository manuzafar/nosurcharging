// ResultsPage integration test — guards against a very specific regression
// that hit us in Phase 4 manual testing:
//
//   The `actions` field is NOT part of the canonical AssessmentOutputs
//   returned by calculateMetrics(). It is built separately and injected
//   into the stored DB record as an extension. When the slider fired and
//   the parent's handleOutputsChange replaced `outputs` with the clean
//   recalculated object, outputs.actions became undefined → ActionList
//   collapsed → viewport shifted → user perceived a page jump to the chart.
//
// The fix was to give `actions` its own state slice seeded once from the
// initial load and never touched by the slider. This test exercises the
// real ResultsPage with mocked dependencies and asserts that after a
// slider interaction, ActionList is still populated.
//
// If this test fails, someone has probably merged `actions` into outputs
// or reverted the separate state slice. Read the comment above line-check
// in app/results/page.tsx before "fixing" the test.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AssessmentOutputs, ActionItem } from '@nosurcharging/calculations/types';

// ── Mock next/navigation ────────────────────────────────────────────────
const mockRouter = { replace: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => (key === 'id' ? 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' : null) }),
  useRouter: () => mockRouter,
}));

// ── Fixture: a stored assessment with actions injected ─────────────────
const BASE_OUTPUTS: AssessmentOutputs = {
  category: 2,
  icSaving: 1724.62,
  debitSaving: 184.62,
  creditSaving: 1540.0,
  todayInterchange: 5301.54,
  todayMargin: 2000.0,
  grossCOA: 9401.54,
  annualMSF: 28000.0,
  surchargeRevenue: 0,
  netToday: 28000.0,
  octNet: 28000.0,
  plSwing: 0,
  todayScheme: 2100.0,
  oct2026Scheme: 2100.0,
  confidence: 'low',
  period: 'pre_reform',
};

const FIXTURE_ACTIONS: ActionItem[] = [
  {
    priority: 'urgent',
    timeAnchor: 'BEFORE END OF APRIL',
    text: 'Ask Stripe whether your rate will change on 1 October 2026.',
    script: 'Stripe is reducing wholesale interchange costs from 1 October.',
    why: "Flat rate adjustments aren't automatic — you must ask.",
  },
  {
    priority: 'plan',
    timeAnchor: 'IN MAY',
    text: 'Compare quotes from two competitors.',
  },
  {
    priority: 'monitor',
    timeAnchor: 'OCTOBER',
    text: 'Check your October statement against your current rate.',
  },
];

// ── Mock getAssessment — returns outputs with actions extension ────────
vi.mock('@/actions/getAssessment', () => ({
  getAssessment: vi.fn(async () => ({
    success: true,
    data: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      category: 2,
      inputs: {
        volume: 2_000_000,
        planType: 'flat',
        msfRate: 0.014,
        surcharging: false,
        surchargeRate: 0,
        surchargeNetworks: [],
        industry: 'retail',
        psp: 'Stripe',
        resolutionTrace: {},
      },
      // The actions field is injected into outputs at DB-insert time in
      // submitAssessment.ts — this fixture mirrors that shape.
      outputs: { ...BASE_OUTPUTS, actions: FIXTURE_ACTIONS },
      created_at: '2026-04-01T00:00:00Z',
    },
  })),
}));

// ── Mock the calculation pipeline the slider drives ────────────────────
// calculateMetrics returns a CLEAN AssessmentOutputs — NO actions. This
// is the root cause of the original bug. The fix must ensure the page
// keeps actions in separate state so this "clean" return does not wipe
// them from the UI.
vi.mock('@nosurcharging/calculations/rules/resolver', () => ({
  resolveAssessmentInputs: vi.fn((raw: unknown) => raw),
}));

vi.mock('@nosurcharging/calculations/calculations', () => ({
  calculateMetrics: vi.fn(() => ({
    ...BASE_OUTPUTS,
    // Simulate a real slider change — icSaving flows through with passThrough
    plSwing: 862.31,
    octNet: 27137.69,
  })),
}));

// Silence analytics during the test
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

// Mock Recharts — jsdom can't render SVG and we don't care about the chart
// for this regression test, we only care about ActionList.
vi.mock('recharts', () => {
  const stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    BarChart: stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: stub,
  };
});

import ResultsPage from '@/app/results/page';

describe('ResultsPage — actions persistence regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ActionList stays populated after slider interaction (regression: outputs-state bug)', async () => {
    render(<ResultsPage />);

    // Wait for the initial getAssessment promise to resolve and the page
    // to swap out of the SkeletonLoader.
    await waitFor(() => {
      expect(screen.getByText(/What to do, in order/i)).toBeInTheDocument();
    });

    // Initial load: all three fixture actions should be visible.
    expect(screen.getByText(/Ask Stripe whether your rate will change/)).toBeInTheDocument();
    expect(screen.getByText(/Compare quotes from two competitors/)).toBeInTheDocument();
    expect(screen.getByText(/Check your October statement/)).toBeInTheDocument();

    // Expand the depth zone to mount the slider.
    fireEvent.click(screen.getByRole('button', { name: /Understand your numbers/i }));

    // Fire a slider change. This calls calculateMetrics() → clean outputs.
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    // THE ASSERTION: ActionList is still fully populated. If the page
    // were reading actions off `outputs` (the old bug), all three items
    // would have vanished here.
    expect(screen.getByText(/Ask Stripe whether your rate will change/)).toBeInTheDocument();
    expect(screen.getByText(/Compare quotes from two competitors/)).toBeInTheDocument();
    expect(screen.getByText(/Check your October statement/)).toBeInTheDocument();
  });

  it('ActionList stays populated after multiple slider moves', async () => {
    render(<ResultsPage />);

    await waitFor(() => {
      expect(screen.getByText(/What to do, in order/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Understand your numbers/i }));
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '25' } });
    fireEvent.change(slider, { target: { value: '75' } });
    fireEvent.change(slider, { target: { value: '100' } });
    fireEvent.change(slider, { target: { value: '0' } });

    expect(screen.getByText(/Ask Stripe whether your rate will change/)).toBeInTheDocument();
    expect(screen.getByText(/Compare quotes from two competitors/)).toBeInTheDocument();
    expect(screen.getByText(/Check your October statement/)).toBeInTheDocument();
  });
});
