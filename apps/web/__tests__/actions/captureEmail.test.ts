import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (accessible inside vi.mock factories) ──────────

const { mockConsentInsert, mockEmailRpc, mockCookieGet, mockCheckRateLimit } = vi.hoisted(() => ({
  mockConsentInsert: vi.fn(),
  mockEmailRpc: vi.fn(),
  mockCookieGet: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

// ── Call order tracking ──────────────────────────────────────────

let operationOrder: string[] = [];

// ── Mocks ────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({ insert: mockConsentInsert })),
    rpc: mockEmailRpc,
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers({ 'cf-connecting-ip': '192.168.1.1' })),
}));

vi.mock('@/lib/security', () => ({
  hashIP: vi.fn((ip: string) => `hmac_${ip}`),
  getClientIP: vi.fn(() => '192.168.1.1'),
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

// ── Import after mocks ───────────────────────────────────────────

import { captureEmail } from '@/actions/captureEmail';

// ── Tests ────────────────────────────────────────────────────────

describe('captureEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    operationOrder = [];
    mockCookieGet.mockReturnValue({ value: 'session-xyz' });
    process.env.EMAIL_ENCRYPTION_KEY = 'test-encryption-key-32chars!!!!!';

    mockConsentInsert.mockImplementation(() => {
      operationOrder.push('consent_insert');
      return Promise.resolve({ error: null });
    });
    mockEmailRpc.mockImplementation(() => {
      operationOrder.push('email_rpc');
      return Promise.resolve({ error: null });
    });
    mockCheckRateLimit.mockResolvedValue({ allowed: true, count: 1, limit: 10 });
  });

  it('email is encrypted via pgp_sym_encrypt RPC (not raw INSERT)', async () => {
    const result = await captureEmail('merchant@shop.com.au');

    expect(result.success).toBe(true);
    expect(mockEmailRpc).toHaveBeenCalledTimes(1);
    const [rpcName, rpcParams] = mockEmailRpc.mock.calls[0]!;
    expect(rpcName).toBe('insert_email_signup');
    expect(rpcParams.p_email).toBe('merchant@shop.com.au');
    expect(rpcParams.p_encryption_key).toBe('test-encryption-key-32chars!!!!!');
  });

  it('raw email never appears in a direct INSERT payload', async () => {
    await captureEmail('secret@email.com');

    // Consent insert should NOT contain the email
    if (mockConsentInsert.mock.calls.length > 0) {
      const consentPayload = JSON.stringify(mockConsentInsert.mock.calls[0]![0]);
      expect(consentPayload).not.toContain('secret@email.com');
    }

    // Email goes through RPC (DB-side encryption), not direct insert
    expect(mockEmailRpc).toHaveBeenCalled();
  });

  it('rate limit: second call from same session is rejected', async () => {
    // First call succeeds
    await captureEmail('first@shop.com');

    // Second call: session rate limit rejects
    mockCheckRateLimit.mockResolvedValueOnce({ allowed: false, count: 2, limit: 1 });

    const result2 = await captureEmail('second@shop.com');
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('already signed up');
  });

  it('consent record created BEFORE email signup record', async () => {
    await captureEmail('order@test.com');

    expect(operationOrder.indexOf('consent_insert')).toBeLessThan(
      operationOrder.indexOf('email_rpc'),
    );
    expect(operationOrder).toEqual(['consent_insert', 'email_rpc']);
  });

  it('checks both session and IP rate limits', async () => {
    await captureEmail('test@shop.com');

    // checkRateLimit called twice: once for session, once for IP
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(2);
    const calls = mockCheckRateLimit.mock.calls;

    // First call: session limit (1 per session)
    expect(calls[0]![0]).toContain('session');
    expect(calls[0]![1]).toBe(1);

    // Second call: IP limit (10 per hour)
    expect(calls[1]![0]).toContain('email');
    expect(calls[1]![1]).toBe(10);
  });

  it('rejects invalid email format', async () => {
    const result = await captureEmail('not-an-email');
    expect(result.success).toBe(false);
    expect(result.error).toContain('valid email');
    expect(mockEmailRpc).not.toHaveBeenCalled();
  });

  it('fails if EMAIL_ENCRYPTION_KEY is not set', async () => {
    delete process.env.EMAIL_ENCRYPTION_KEY;

    const result = await captureEmail('test@shop.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Configuration error');
    expect(mockEmailRpc).not.toHaveBeenCalled();
  });
});
