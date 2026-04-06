import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateConfig } from '@/lib/validateConfig';

describe('validateConfig', () => {
  beforeEach(() => {
    // Set valid defaults for all required vars
    vi.stubEnv('IP_HASH_SECRET', 'a'.repeat(64));
    vi.stubEnv('EMAIL_ENCRYPTION_KEY', 'test-encryption-key-32chars!!!!!');
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:pwd@host.com:6543/postgres');
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '0.35');
    vi.stubEnv('CALC_CARD_MIX_VISA_CREDIT', '0.18');
    vi.stubEnv('CALC_CARD_MIX_MC_DEBIT', '0.17');
    vi.stubEnv('CALC_CARD_MIX_MC_CREDIT', '0.12');
    vi.stubEnv('CALC_CARD_MIX_EFTPOS', '0.08');
    vi.stubEnv('CALC_CARD_MIX_AMEX', '0.05');
    vi.stubEnv('CALC_CARD_MIX_FOREIGN', '0.05');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('passes with valid config', () => {
    expect(() => validateConfig()).not.toThrow();
  });

  it('throws when card mix sum != 1.0', () => {
    vi.stubEnv('CALC_CARD_MIX_VISA_DEBIT', '0.50'); // sum now 1.15
    expect(() => validateConfig()).toThrow('CALC_CARD_MIX env vars sum to');
  });

  it('throws when IP_HASH_SECRET is missing', () => {
    vi.stubEnv('IP_HASH_SECRET', '');
    expect(() => validateConfig()).toThrow('IP_HASH_SECRET');
  });

  it('throws when IP_HASH_SECRET is too short', () => {
    vi.stubEnv('IP_HASH_SECRET', 'tooshort');
    expect(() => validateConfig()).toThrow('must be >= 32');
  });

  it('throws when DATABASE_URL uses port 5432', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:pwd@host.com:5432/postgres');
    expect(() => validateConfig()).toThrow('port 6543');
  });

  it('throws when EMAIL_ENCRYPTION_KEY is missing', () => {
    vi.stubEnv('EMAIL_ENCRYPTION_KEY', '');
    expect(() => validateConfig()).toThrow('EMAIL_ENCRYPTION_KEY');
  });

  it('does not throw when DATABASE_URL is not set (build-only context)', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => validateConfig()).not.toThrow();
  });
});
