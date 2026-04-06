import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

// ── Hoisted mocks ────────────────────────────────────────────────

const { mockInsert, mockRpc, mockEmailSend } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockRpc: vi.fn().mockResolvedValue({ data: 'encrypted_email', error: null }),
  mockEmailSend: vi.fn().mockResolvedValue({ data: { id: 'msg_1' }, error: null }),
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({ insert: mockInsert })),
    rpc: mockRpc,
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

// ── Helpers ──────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-123';

function makeSignedRequest(body: object): { bodyStr: string; signature: string } {
  const bodyStr = JSON.stringify(body);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(bodyStr).digest('hex');
  return { bodyStr, signature };
}

const VALID_PAYLOAD = {
  event: 'invitee.created',
  payload: {
    invitee: {
      name: 'Jane Merchant',
      email: 'jane@shop.com.au',
    },
    event: {
      start_time: '2026-04-10T10:00:00Z',
    },
    questions_and_answers: [
      { question: 'Monthly volume?', answer: '$200K' },
    ],
  },
};

// ── Import route handler ─────────────────────────────────────────

// We can't easily test a Next.js route handler directly, so we test
// the logic by calling the POST function with a mock NextRequest.

import { POST } from '@/app/api/webhooks/calendly/route';
import { NextRequest } from 'next/server';

function makeRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://nosurcharging.com.au/api/webhooks/calendly', {
    method: 'POST',
    body,
    headers,
  });
}

// ── Tests ────────────────────────────────────────────────────────

describe('Calendly webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CALENDLY_WEBHOOK_SECRET', WEBHOOK_SECRET);
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM', 'hello@nosurcharging.com.au');
    vi.stubEnv('EMAIL_ENCRYPTION_KEY', 'test-encryption-key');
    vi.stubEnv('NOTIFICATION_EMAIL', 'manu@test.com');
  });

  it('valid signature + invitee.created → 200 + INSERT + emails sent', async () => {
    const { bodyStr, signature } = makeSignedRequest(VALID_PAYLOAD);
    const req = makeRequest(bodyStr, { 'Calendly-Webhook-Signature': signature });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Consulting lead inserted
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const inserted = mockInsert.mock.calls[0]![0];
    expect(inserted.name).toBe('Jane Merchant');
    expect(inserted.source).toBe('calendly');
    expect(inserted.status).toBe('booked');

    // Two emails sent (prep + notification)
    expect(mockEmailSend).toHaveBeenCalledTimes(2);
  });

  it('invalid signature → 401', async () => {
    const bodyStr = JSON.stringify(VALID_PAYLOAD);
    const req = makeRequest(bodyStr, { 'Calendly-Webhook-Signature': 'bad-signature' });

    const res = await POST(req);
    expect(res.status).toBe(401);

    // No insert, no emails
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it('wrong event type → 200 (ignored gracefully)', async () => {
    const otherPayload = { ...VALID_PAYLOAD, event: 'invitee.canceled' };
    const { bodyStr, signature } = makeSignedRequest(otherPayload);
    const req = makeRequest(bodyStr, { 'Calendly-Webhook-Signature': signature });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // No insert, no emails — gracefully ignored
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it('Supabase failure → still returns 200 (webhook resilience)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    const { bodyStr, signature } = makeSignedRequest(VALID_PAYLOAD);
    const req = makeRequest(bodyStr, { 'Calendly-Webhook-Signature': signature });

    const res = await POST(req);
    // Must return 200 even if DB insert fails — prevent webhook retries
    expect(res.status).toBe(200);

    // Emails should still be attempted
    expect(mockEmailSend).toHaveBeenCalled();
  });
});
