import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ── Hoisted mocks ────────────────────────────────────────────────

const { mockSubmitAssessment, mockTrackEvent } = vi.hoisted(() => ({
  mockSubmitAssessment: vi.fn(),
  mockTrackEvent: vi.fn(),
}));

vi.mock('@/actions/submitAssessment', () => ({
  submitAssessment: mockSubmitAssessment,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: mockTrackEvent,
  Analytics: {},
}));

// ── Import after mocks ───────────────────────────────────────────

import { RevealScreen } from '@/components/assessment/RevealScreen';
import type { AssessmentFormData, AssessmentResult } from '@/actions/submitAssessment';

// ── Helpers ──────────────────────────────────────────────────────

const MOCK_FORM_DATA: AssessmentFormData = {
  volume: 2_000_000,
  planType: 'costplus',
  msfRate: 0.014,
  surcharging: false,
  surchargeRate: 0,
  surchargeNetworks: [],
  industry: 'retail',
  psp: 'Stripe',
  passThrough: 0,
};

const MOCK_SUCCESS_RESULT: AssessmentResult = {
  success: true,
  outputs: {
    category: 1,
    icSaving: 1724.62,
    debitSaving: 184.62,
    creditSaving: 1540.0,
    grossCOA: 9401.54,
    annualMSF: 28000.0,
    todayInterchange: 5301.54,
    todayMargin: 2000.0,
    surchargeRevenue: 0,
    netToday: 9401.54,
    octNet: 7676.92,
    plSwing: 1724.62,
    plSwingLow: 1724.62,
    plSwingHigh: 1724.62,
    rangeDriver: 'card_mix' as const,
    rangeNote: '',
    todayScheme: 2100.0,
    oct2026Scheme: 2100.0,
    confidence: 'low',
    period: 'pre_reform',
  },
  actions: [],
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// ── Tests ────────────────────────────────────────────────────────

describe('RevealScreen', () => {
  const onComplete = vi.fn();
  const onError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('submitAssessment called immediately on mount (not after 1.1s)', () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    // Called at t=0, before any timer advances
    expect(mockSubmitAssessment).toHaveBeenCalledTimes(1);
    // First arg is form data, second is idempotency key (UUID)
    expect(mockSubmitAssessment.mock.calls[0]![0]).toEqual(MOCK_FORM_DATA);
    expect(mockSubmitAssessment.mock.calls[0]![1]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('category label not visible at t=0', () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    // The category label paragraph exists but has opacity-0 class
    const labels = screen.getAllByText('', { selector: 'p' });
    const categoryP = labels.find((el) => el.className.includes('opacity-0'));
    expect(categoryP).toBeDefined();
  });

  it('category label visible after 600ms', async () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    // Resolve the action quickly so category label gets set
    await act(async () => {
      deferred.resolve(MOCK_SUCCESS_RESULT);
      // Flush microtasks
      await Promise.resolve();
    });

    // Advance to 600ms — showCategory becomes true
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Now the category label should have opacity-100
    const categoryText = screen.getByText(/category 1/i);
    expect(categoryText.className).toContain('opacity-100');
  });

  it('onComplete called after 1100ms when action resolves fast', async () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    // Action resolves immediately
    await act(async () => {
      deferred.resolve(MOCK_SUCCESS_RESULT);
      await Promise.resolve();
    });

    // Not called before 1100ms
    expect(onComplete).not.toHaveBeenCalled();

    // Advance to 1100ms
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(MOCK_SUCCESS_RESULT);
  });

  it('if submitAssessment resolves AFTER 1100ms, onComplete waits', async () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    // Advance past 1100ms — action not yet resolved
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // onComplete should NOT be called yet (action still pending)
    expect(onComplete).not.toHaveBeenCalled();

    // Now resolve the action
    await act(async () => {
      deferred.resolve(MOCK_SUCCESS_RESULT);
      await Promise.resolve();
    });

    // onComplete should now fire (timerDone was true, action just finished)
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('displays "Calculating your position..." label', () => {
    mockSubmitAssessment.mockReturnValue(new Promise(() => {}));

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    expect(screen.getByText(/calculating your position/i)).toBeInTheDocument();
  });

  it('calls onError when submitAssessment fails', async () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    render(
      <RevealScreen
        formData={MOCK_FORM_DATA}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    await act(async () => {
      deferred.resolve({ success: false, error: 'Server error' });
      await Promise.resolve();
    });

    expect(onError).toHaveBeenCalledWith('Server error');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('Cat 5 (zero_cost) shows the Cat 5 categoryLabel', async () => {
    const deferred = createDeferred<AssessmentResult>();
    mockSubmitAssessment.mockReturnValue(deferred.promise);

    const cat5Result: AssessmentResult = {
      success: true,
      outputs: {
        ...MOCK_SUCCESS_RESULT.outputs!,
        category: 5,
        netToday: 0,
        octNet: 8400,
        plSwing: -8400,
        plSwingLow: -9600,
        plSwingHigh: -7200,
        rangeDriver: 'post_reform_rate',
        estimatedMSFRate: 0.014,
      },
      actions: [],
    };

    render(
      <RevealScreen
        formData={{ ...MOCK_FORM_DATA, planType: 'zero_cost' }}
        onComplete={onComplete}
        onError={onError}
      />,
    );

    await act(async () => {
      deferred.resolve(cat5Result);
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByText(/category 5/i)).toBeInTheDocument();
    expect(screen.getByText(/zero-cost plan ends/i)).toBeInTheDocument();
  });
});
