import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────

const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({ insert: mockInsert })),
  },
}));

const mockCookieGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers({
    'cf-connecting-ip': '203.0.113.42',
    'user-agent': 'TestAgent/1.0',
  })),
}));

vi.mock('@/lib/security', () => ({
  hashIP: vi.fn((ip: string) => `hashed_${ip}`),
  getClientIP: vi.fn(() => '203.0.113.42'),
}));

// ── Import after mocks ───────────────────────────────────────────

import { recordConsent } from '@/actions/recordConsent';

// ── Tests ────────────────────────────────────────────────────────

describe('recordConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue({ value: 'test-session-id' });
  });

  it('inserts with correct consent_type, consent_version v1.0, consented=true', async () => {
    const result = await recordConsent({
      consentType: 'disclaimer',
      consentText: 'I understand this is not financial advice.',
      consentVersion: 'v1.0',
      consented: true,
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.consent_type).toBe('disclaimer');
    expect(insertPayload.consent_version).toBe('v1.0');
    expect(insertPayload.consented).toBe(true);
    expect(insertPayload.consent_text).toBe('I understand this is not financial advice.');
  });

  it('stores ip_hash (not raw IP) matching HMAC-SHA256 format', async () => {
    await recordConsent({
      consentType: 'disclaimer',
      consentText: 'Test text',
      consentVersion: 'v1.0',
      consented: true,
    });

    const insertPayload = mockInsert.mock.calls[0]![0];

    // Verify hashed IP is stored (not raw)
    expect(insertPayload.ip_hash).toBe('hashed_203.0.113.42');
    expect(insertPayload.ip_hash).not.toBe('203.0.113.42');

    // Verify no field contains the raw IP
    const allValues = Object.values(insertPayload);
    expect(allValues).not.toContain('203.0.113.42');
  });

  it('stores session_id and user_agent', async () => {
    await recordConsent({
      consentType: 'disclaimer',
      consentText: 'Test',
      consentVersion: 'v1.0',
      consented: true,
    });

    const insertPayload = mockInsert.mock.calls[0]![0];
    expect(insertPayload.session_id).toBe('test-session-id');
    expect(insertPayload.user_agent).toBe('TestAgent/1.0');
  });

  it('returns error if session cookie is missing', async () => {
    mockCookieGet.mockReturnValue(undefined);

    const result = await recordConsent({
      consentType: 'disclaimer',
      consentText: 'Test',
      consentVersion: 'v1.0',
      consented: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('No active session');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns error on Supabase insert failure', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    const result = await recordConsent({
      consentType: 'disclaimer',
      consentText: 'Test',
      consentVersion: 'v1.0',
      consented: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to record consent');
  });
});
