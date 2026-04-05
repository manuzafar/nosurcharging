import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (hoisted before imports) ───────────────────────────────

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: mockCookieSet,
    get: mockCookieGet,
  })),
}));

const TEST_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

vi.mock('crypto', async () => {
  const actual = await vi.importActual<typeof import('crypto')>('crypto');
  return {
    ...actual,
    randomUUID: vi.fn(() => TEST_UUID),
  };
});

// ── Import after mocks ───────────────────────────────────────────

import { createSession, getSessionId } from '@/actions/createSession';

// ── Tests ────────────────────────────────────────────────────────

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a session ID via randomUUID()', async () => {
    const sessionId = await createSession();
    expect(sessionId).toBe(TEST_UUID);
  });

  it('sets cookie with HttpOnly flag', async () => {
    await createSession();
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    const [, , options] = mockCookieSet.mock.calls[0]!;
    expect(options.httpOnly).toBe(true);
  });

  it('sets cookie with Secure flag in production', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    await createSession();
    const [, , options] = mockCookieSet.mock.calls[0]!;
    expect(options.secure).toBe(true);
    process.env.NODE_ENV = origEnv;
  });

  it('sets cookie with SameSite=strict', async () => {
    await createSession();
    const [, , options] = mockCookieSet.mock.calls[0]!;
    expect(options.sameSite).toBe('strict');
  });

  it('sets cookie name to ns_session with the generated UUID', async () => {
    await createSession();
    const [name, value] = mockCookieSet.mock.calls[0]!;
    expect(name).toBe('ns_session');
    expect(value).toBe(TEST_UUID);
  });

  it('sets 24-hour maxAge', async () => {
    await createSession();
    const [, , options] = mockCookieSet.mock.calls[0]!;
    expect(options.maxAge).toBe(86400);
  });
});

describe('getSessionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session ID from cookie', async () => {
    mockCookieGet.mockReturnValue({ value: TEST_UUID });
    const id = await getSessionId();
    expect(id).toBe(TEST_UUID);
  });

  it('returns null when cookie is missing (not readable from client context)', async () => {
    mockCookieGet.mockReturnValue(undefined);
    const id = await getSessionId();
    expect(id).toBeNull();
  });
});
