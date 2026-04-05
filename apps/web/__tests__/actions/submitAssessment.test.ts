import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Call order tracking ──────────────────────────────────────────

let callOrder: string[] = [];

// ── Mocks ────────────────────────────────────────────────────────

const INSERTED_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const mockSingle = vi.fn().mockResolvedValue({ data: { id: INSERTED_ID }, error: null });
const mockInsertSelect = vi.fn(() => ({ single: mockSingle }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsert: ReturnType<typeof vi.fn<any>> = vi.fn((..._args: any[]) => ({ select: mockInsertSelect }));
const mockSelectLimit = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: mockSelectLimit,
        })),
      })),
    })),
  },
}));

const mockCookieGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers({ 'cf-connecting-ip': '10.0.0.1' })),
}));

vi.mock('@/lib/security', () => ({
  hashIP: vi.fn((ip: string) => `sha256_${ip}`),
  getClientIP: vi.fn(() => '10.0.0.1'),
  sanitiseForHTML: vi.fn((s: string) => s),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, count: 1, limit: 100 }),
}));

// Mock the calculation pipeline — track call order
vi.mock('@nosurcharging/calculations/rules/resolver', () => ({
  resolveAssessmentInputs: vi.fn((..._args: unknown[]) => {
    callOrder.push('resolveAssessmentInputs');
    return {
      volume: 3_000_000,
      planType: 'flat',
      msfRate: 0.014,
      surcharging: true,
      surchargeRate: 0.012,
      surchargeNetworks: ['visa', 'eftpos'],
      industry: 'retail',
      psp: 'Stripe',
      passThrough: 0.45,
      cardMix: {
        debitShare: 0.6, consumerCreditShare: 0.35, foreignShare: 0.05,
        amexShare: 0.05, commercialShare: 0,
        breakdown: {
          visa_debit: 0.35, visa_credit: 0.18, mastercard_debit: 0.17,
          mastercard_credit: 0.12, eftpos: 0.08, amex: 0.05, foreign: 0.05, commercial: 0,
        },
      },
      avgTransactionValue: 65,
      expertRates: { debitCents: 9, creditPct: 0.52, marginPct: 0.10 },
      resolutionTrace: {},
      confidence: 'low' as const,
    };
  }),
}));

vi.mock('@nosurcharging/calculations/calculations', () => ({
  calculateMetrics: vi.fn((..._args: unknown[]) => {
    callOrder.push('calculateMetrics');
    // Return Cat 4 outputs (flat + surcharging) by default
    return {
      category: 4 as const,
      icSaving: 2586.92,
      debitSaving: 276.92,
      creditSaving: 2310.0,
      netToday: 6000.0,
      octNet: 40835.89,
      plSwing: -34835.89,
      todayScheme: 3150.0,
      oct2026Scheme: 3150.0,
      confidence: 'low' as const,
      period: 'pre_reform' as const,
    };
  }),
}));

vi.mock('@nosurcharging/calculations/actions', () => ({
  buildActions: vi.fn(() => [
    { priority: 'urgent', timeAnchor: 'This week', text: 'Call Stripe' },
  ]),
}));

// ── Import after mocks ───────────────────────────────────────────

import { submitAssessment } from '@/actions/submitAssessment';
import type { AssessmentFormData } from '@/actions/submitAssessment';
import { checkRateLimit } from '@/lib/rateLimit';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';

const CAT4_FORM: AssessmentFormData = {
  volume: 3_000_000,
  planType: 'flat',
  msfRate: 0.014,
  surcharging: true,
  surchargeRate: 0.012,
  surchargeNetworks: ['visa', 'eftpos'],
  industry: 'retail',
  psp: 'Stripe',
  passThrough: 0.45,
};

const CAT1_FORM: AssessmentFormData = {
  volume: 2_000_000,
  planType: 'costplus',
  msfRate: 0.014,
  surcharging: false,
  surchargeRate: 0,
  surchargeNetworks: [],
  industry: 'cafe',
  psp: 'Square',
  passThrough: 0,
};

const TEST_IDEMPOTENCY_KEY = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// ── Tests ────────────────────────────────────────────────────────

describe('submitAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder = [];
    mockCookieGet.mockReturnValue({ value: 'session-abc-123' });
    mockSelectLimit.mockResolvedValue({ data: [], error: null });
  });

  it('calls resolveAssessmentInputs() BEFORE calculateMetrics()', async () => {
    await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(callOrder[0]).toBe('resolveAssessmentInputs');
    expect(callOrder[1]).toBe('calculateMetrics');
    expect(callOrder.indexOf('resolveAssessmentInputs')).toBeLessThan(
      callOrder.indexOf('calculateMetrics'),
    );
  });

  it('Category 4 flat+surcharging produces negative plSwing in stored output', async () => {
    const result = await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(true);
    expect(result.outputs!.category).toBe(4);
    expect(result.outputs!.plSwing).toBeLessThan(0);
    expect(result.outputs!.plSwing).toBeCloseTo(-34835.89, 1);
  });

  it('Category 1 cost-plus+not-surcharging produces positive plSwing', async () => {
    // Override calculateMetrics for Cat 1
    vi.mocked(calculateMetrics).mockReturnValueOnce({
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
      todayScheme: 2100.0,
      oct2026Scheme: 2100.0,
      confidence: 'low',
      period: 'pre_reform',
    });

    const result = await submitAssessment(CAT1_FORM, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(true);
    expect(result.outputs!.category).toBe(1);
    expect(result.outputs!.plSwing).toBeGreaterThan(0);
    expect(result.outputs!.plSwing).toBeCloseTo(1724.62, 1);
  });

  it('ip_hash stored is hashed (never raw IP)', async () => {
    await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.ip_hash).toBe('sha256_10.0.0.1');
    expect(insertPayload.ip_hash).not.toBe('10.0.0.1');

    // No field contains raw IP
    const allValues = JSON.stringify(insertPayload);
    expect(allValues).not.toContain('"10.0.0.1"');
  });

  it('rate limit: 101st request from same IP is rejected', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      count: 101,
      limit: 100,
    });

    const result = await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Rate limit');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('missing session cookie returns error', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No active session');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('stores category and outputs in assessments table', async () => {
    await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.session_id).toBe('session-abc-123');
    expect(insertPayload.category).toBe(4);
    expect(insertPayload.country_code).toBe('AU');
    expect(insertPayload.inputs).toBeDefined();
    expect(insertPayload.outputs).toBeDefined();
  });

  it('returns assessmentId that is present and non-null', async () => {
    const result = await submitAssessment(CAT4_FORM, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(true);
    expect(result.assessmentId).toBeDefined();
    expect(result.assessmentId).not.toBeNull();
    expect(result.assessmentId).toBe(INSERTED_ID);
  });

  it('rejects submission when PSP is missing', async () => {
    const noPspForm = { ...CAT4_FORM, psp: '' };
    const result = await submitAssessment(noPspForm, TEST_IDEMPOTENCY_KEY);

    expect(result.success).toBe(false);
    expect(result.error).toContain('PSP is required');
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
