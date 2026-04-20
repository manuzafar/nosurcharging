import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────

const { mockInsert, mockCookieGet, mockSelectLimit } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockCookieGet: vi.fn(),
  mockSelectLimit: vi.fn(),
}));

// ── Mocks ────────────────────────────────────────────────────────

// Track which table is queried to return different results
let lastTable = '';

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      lastTable = table;
      return {
        insert: mockInsert,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: mockSelectLimit,
          })),
        })),
      };
    }),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: vi.fn(),
  })),
}));

// ── Import after mocks ───────────────────────────────────────────

import { contributeRate } from '@/actions/contributeRate';
import type { ContributeRateInput } from '@/actions/contributeRate';

const VALID_ASSESSMENT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const VALID_INPUT: ContributeRateInput = {
  assessmentId: VALID_ASSESSMENT_ID,
  pspName: 'Stripe',
  planType: 'flat',
  effectiveRatePct: 1.4,
  volumeBand: '100k-1m',
};

// ── Tests ────────────────────────────────────────────────────────

describe('contributeRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastTable = '';
    mockCookieGet.mockReturnValue({ value: 'session-abc' });
    mockInsert.mockResolvedValue({ error: null });

    // Default: assessment exists, no existing rate contribution
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // First select: assessments table — assessment exists
        return Promise.resolve({ data: [{ id: VALID_ASSESSMENT_ID }], error: null });
      }
      // Second select: psp_rate_registry — no existing contribution
      return Promise.resolve({ data: [], error: null });
    });
  });

  it('converts rate % to decimal (1.4 stored as 0.014)', async () => {
    const result = await contributeRate(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.effective_rate_pct).toBeCloseTo(0.014, 5);
    // Verify it's NOT the raw percentage
    expect(insertPayload.effective_rate_pct).not.toBe(1.4);
  });

  it('validates assessment_id linkage (non-existent ID rejected)', async () => {
    // Override: assessment does NOT exist
    mockSelectLimit.mockResolvedValueOnce({ data: [], error: null });

    const result = await contributeRate(VALID_INPUT);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Assessment not found');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('trust_score=1 on all Phase 1 submissions', async () => {
    await contributeRate(VALID_INPUT);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.trust_score).toBe(1);
    expect(insertPayload.quarantined).toBe(false);
  });

  it('enforces 1 submission per assessment_id', async () => {
    // First select: assessment exists
    // Second select: already has a contribution
    let selectCallCount = 0;
    mockSelectLimit.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve({ data: [{ id: VALID_ASSESSMENT_ID }], error: null });
      }
      return Promise.resolve({ data: [{ id: 'existing-rate-id' }], error: null });
    });

    const result = await contributeRate(VALID_INPUT);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already contributed');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects invalid assessment_id format', async () => {
    const result = await contributeRate({
      ...VALID_INPUT,
      assessmentId: 'not-a-uuid',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid assessment ID');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects rate outside valid range (0-10%)', async () => {
    const result = await contributeRate({
      ...VALID_INPUT,
      effectiveRatePct: 15,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('between 0% and 10%');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('stores correct fields including country_code and volume_band', async () => {
    await contributeRate(VALID_INPUT);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.assessment_id).toBe(VALID_ASSESSMENT_ID);
    expect(insertPayload.psp_name).toBe('Stripe');
    expect(insertPayload.plan_type).toBe('flat');
    expect(insertPayload.country_code).toBe('AU');
    expect(insertPayload.volume_band).toBe('100k-1m');
  });

  it('returns error if session is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await contributeRate(VALID_INPUT);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active session');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('stores industry and stateCode when provided', async () => {
    await contributeRate({
      ...VALID_INPUT,
      industry: 'hospitality',
      stateCode: 'VIC',
    });

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.industry).toBe('hospitality');
    expect(insertPayload.state_code).toBe('VIC');
  });

  it('stores null for industry and stateCode when omitted', async () => {
    await contributeRate(VALID_INPUT);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.industry).toBeNull();
    expect(insertPayload.state_code).toBeNull();
  });
});
