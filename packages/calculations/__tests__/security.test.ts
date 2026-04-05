import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the security module from apps/web
// Import using relative path since this is in the same monorepo
import { hashIP } from '../../../apps/web/lib/security';

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('hashIP', () => {
  it('throws when IP_HASH_SECRET is not set', () => {
    vi.stubEnv('IP_HASH_SECRET', '');
    delete process.env.IP_HASH_SECRET;
    expect(() => hashIP('1.2.3.4')).toThrow('IP_HASH_SECRET');
  });

  it('same IP + same secret = same hash (deterministic)', () => {
    vi.stubEnv('IP_HASH_SECRET', 'test-secret-1');
    const hash1 = hashIP('192.168.1.1');
    const hash2 = hashIP('192.168.1.1');
    expect(hash1).toBe(hash2);
  });

  it('same IP + different secret = different hash (rainbow table resistance)', () => {
    vi.stubEnv('IP_HASH_SECRET', 'secret-a');
    const hash1 = hashIP('192.168.1.1');
    vi.stubEnv('IP_HASH_SECRET', 'secret-b');
    const hash2 = hashIP('192.168.1.1');
    expect(hash1).not.toBe(hash2);
  });

  it('produces hex SHA-256 output', () => {
    vi.stubEnv('IP_HASH_SECRET', 'test-secret');
    const hash = hashIP('1.2.3.4');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('different IPs produce different hashes', () => {
    vi.stubEnv('IP_HASH_SECRET', 'test-secret');
    const hash1 = hashIP('1.1.1.1');
    const hash2 = hashIP('2.2.2.2');
    expect(hash1).not.toBe(hash2);
  });
});
