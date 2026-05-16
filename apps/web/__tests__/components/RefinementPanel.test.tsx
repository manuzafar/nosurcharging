import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Hoisted mocks ────────────────────────────────────────────────
//
// Per RESULTS_HEADER_REDESIGN_BRIEF (May 2026): the "Result looks off?"
// trigger + FeedbackModal mount relocated from ResultsTopBar into
// RefinementPanel. These tests cover the new placement.
//
// We mock calculateMetrics to a stable shape so the debounce-driven
// recalc effect doesn't try to exercise the real calc engine. The
// "Your impact" block reads its value from local state seeded by
// `initialResult.plSwing`, so the initial render is fully covered
// without firing the timer.

const { mockResultLooksOff } = vi.hoisted(() => ({
  mockResultLooksOff: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  Analytics: {
    resultLooksOff: mockResultLooksOff,
    accuracyRefined: vi.fn(),
    feedbackOpened: vi.fn(),
    feedbackSubmitted: vi.fn(),
  },
}));

// FeedbackModal is mocked to a simple visibility marker — the modal
// itself is unchanged, only its trigger location moved.
vi.mock('@/components/results/FeedbackModal', () => ({
  FeedbackModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="feedback-modal" /> : null,
}));

vi.mock('@nosurcharging/calculations/calculations', () => ({
  // Stable echo — the panel passes whatever we return up via
  // onRefinedResult. Returning the seeded outputs keeps the
  // post-debounce livePlSwing equal to initialResult.plSwing for the
  // baseline assertions.
  calculateMetrics: vi.fn((inputs: unknown) => ({
    plSwing: -129_800,
    icSaving: 0,
    debitSaving: 0,
    creditSaving: 0,
    todayInterchange: 0,
    todayMargin: 0,
    grossCOA: 0,
    annualMSF: 0,
    surchargeRevenue: 0,
    netToday: 0,
    octNet: 0,
    plSwingLow: -129_800,
    plSwingHigh: -129_800,
    rangeDriver: 'card_mix',
    rangeNote: '',
    todayScheme: 0,
    oct2026Scheme: 0,
    confidence: 'low',
    period: 'pre_reform',
    category: 4,
  })),
}));

import { RefinementPanel } from '@/components/results/RefinementPanel';
import type {
  AssessmentOutputs,
  ResolvedAssessmentInputs,
  ResolutionTrace,
} from '@nosurcharging/calculations/types';

// ── Fixtures ────────────────────────────────────────────────────

const BASE_OUTPUTS: AssessmentOutputs = {
  category: 4,
  icSaving: 4_200,
  debitSaving: 1_200,
  creditSaving: 3_000,
  todayInterchange: 12_000,
  todayMargin: 8_000,
  grossCOA: 25_000,
  annualMSF: 28_000,
  surchargeRevenue: 7_500,
  netToday: 20_500,
  octNet: 25_900,
  plSwing: -129_800,
  plSwingLow: -129_800,
  plSwingHigh: -129_800,
  rangeDriver: 'card_mix',
  rangeNote: '',
  todayScheme: 2_100,
  oct2026Scheme: 2_100,
  confidence: 'low',
  period: 'pre_reform',
};

const BASE_INPUTS: ResolvedAssessmentInputs = {
  volume: 2_000_000,
  planType: 'flat',
  msfRate: 0.014,
  surcharging: true,
  surchargeRate: 0.015,
  surchargeNetworks: ['visa', 'mastercard', 'eftpos'],
  industry: 'retail',
  psp: 'Stripe',
  passThrough: 0.45,
  avgTransactionValue: 65,
  cardMix: {
    debitShare: 0.6,
    consumerCreditShare: 0.3,
    foreignShare: 0.05,
    commercialShare: 0,
    amexShare: 0.05,
    breakdown: {
      visa_debit: 0.35,
      visa_credit: 0.18,
      mastercard_debit: 0.17,
      mastercard_credit: 0.12,
      eftpos: 0.08,
      amex: 0.05,
      foreign: 0.05,
      commercial: 0,
    },
  },
  expertRates: { debitCents: 0.09, creditPct: 0.47, marginPct: 0.1 },
  resolutionTrace: {},
  confidence: 'low',
};

const TRACE: ResolutionTrace = {
  'cardMix.visa_debit': { source: 'regulatory_constant', value: 0.35, label: 'RBA average' },
};

const baseProps = {
  initialResult: BASE_OUTPUTS,
  resolutionTrace: TRACE,
  inputs: BASE_INPUTS,
  industry: 'retail',
  category: 4 as const,
  volume: 2_000_000,
  assessmentId: 'test-assessment-123',
  onRefinedResult: vi.fn(),
};

// ── Tests ────────────────────────────────────────────────────────

describe('RefinementPanel — Your impact block + relocated feedback trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the "YOUR IMPACT" label and live hint above the field list', () => {
    render(<RefinementPanel {...baseProps} />);
    // Inline label split with "New" tag — match case-insensitively
    expect(screen.getByText(/Your impact/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Updates live as you refine inputs below/i),
    ).toBeInTheDocument();
  });

  it('renders the formatted signed-dollar plSwing value from initialResult', () => {
    render(<RefinementPanel {...baseProps} />);
    // BASE_OUTPUTS.plSwing = -129_800 → "−$129,800" (real minus sign U+2212)
    const value = screen.getByTestId('your-impact-value');
    expect(value).toBeInTheDocument();
    expect(value.textContent).toBe('−$129,800');
  });

  it('colours the impact value red for negative plSwing', () => {
    render(<RefinementPanel {...baseProps} />);
    const value = screen.getByTestId('your-impact-value');
    expect(value).toHaveStyle({ color: '#A32D2D' });
  });

  it('colours the impact value emerald for positive plSwing', () => {
    const positiveProps = {
      ...baseProps,
      initialResult: { ...BASE_OUTPUTS, plSwing: 4_200 },
    };
    render(<RefinementPanel {...positiveProps} />);
    const value = screen.getByTestId('your-impact-value');
    expect(value.textContent).toBe('+$4,200');
    expect(value).toHaveStyle({ color: '#1A6B5A' });
  });

  it('renders the relocated "Result looks off? →" link inside the panel', () => {
    render(<RefinementPanel {...baseProps} />);
    expect(
      screen.getByRole('button', { name: /Result looks off/i }),
    ).toBeInTheDocument();
  });

  it('clicking "Result looks off?" opens the FeedbackModal and fires resultLooksOff', () => {
    render(<RefinementPanel {...baseProps} />);
    // Modal is hidden by default
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Result looks off/i }));

    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    // Analytics fires with the new (category, accuracy_pct) shape — the
    // accuracy value at default state is the baseline 20 from
    // computeAccuracy() on an unedited trace.
    expect(mockResultLooksOff).toHaveBeenCalledTimes(1);
    expect(mockResultLooksOff).toHaveBeenCalledWith(
      expect.objectContaining({ category: 4 }),
    );
  });

  it('still renders the existing Refine panel subhead verbatim', () => {
    render(<RefinementPanel {...baseProps} />);
    expect(
      screen.getByText(
        /Fill in what you know — the estimate sharpens as you go\./,
      ),
    ).toBeInTheDocument();
  });

  it('still renders the existing privacy line verbatim', () => {
    render(<RefinementPanel {...baseProps} />);
    expect(
      screen.getByText(
        /Your edits update this page only\. We never share or store what you type here\./,
      ),
    ).toBeInTheDocument();
  });
});
