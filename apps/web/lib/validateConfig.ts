// Validates critical environment variables at startup.
// Called from layout.tsx (server component) — fails loudly in Railway
// if env vars are misconfigured.
//
// Checks:
//   a. CALC_CARD_MIX_* vars sum to 1.0 within 0.001
//   b. IP_HASH_SECRET present and >= 32 chars
//   c. DATABASE_URL uses port 6543 (PgBouncer), not 5432
//   d. EMAIL_ENCRYPTION_KEY present

export function validateConfig(): void {
  validateCardMix();
  validateIPHashSecret();
  validateDatabaseURL();
  validateEmailEncryptionKey();
}

// a. Card mix vars must sum to 1.0
function validateCardMix(): void {
  const cardMixKeys = [
    'CALC_CARD_MIX_VISA_DEBIT',
    'CALC_CARD_MIX_VISA_CREDIT',
    'CALC_CARD_MIX_MC_DEBIT',
    'CALC_CARD_MIX_MC_CREDIT',
    'CALC_CARD_MIX_EFTPOS',
    'CALC_CARD_MIX_AMEX',
    'CALC_CARD_MIX_FOREIGN',
  ];

  const values = cardMixKeys.map((key) => {
    const raw = process.env[key];
    if (raw === undefined || raw === '') return null;
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      throw new Error(`Invalid CALC_CARD_MIX env var: ${key}="${raw}" is not a valid number`);
    }
    return parsed;
  });

  const setValues = values.filter((v): v is number => v !== null);
  if (setValues.length === 0) return;

  if (setValues.length !== cardMixKeys.length) {
    const missing = cardMixKeys.filter((_, i) => values[i] === null);
    throw new Error(
      `Partial CALC_CARD_MIX env vars: ${missing.join(', ')} not set. Set all 7 or none.`,
    );
  }

  const sum = setValues.reduce((s, v) => s + v, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `CALC_CARD_MIX env vars sum to ${sum.toFixed(4)}, expected 1.0 (tolerance 0.001)`,
    );
  }
}

// b. IP_HASH_SECRET must be present and >= 32 chars
function validateIPHashSecret(): void {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    throw new Error('IP_HASH_SECRET environment variable is not set. Required for IP hashing (SR-02).');
  }
  if (secret.length < 32) {
    throw new Error(
      `IP_HASH_SECRET is ${secret.length} chars, must be >= 32. Use: openssl rand -hex 32`,
    );
  }
}

// c. DATABASE_URL must use port 6543 (PgBouncer pooler), not 5432
function validateDatabaseURL(): void {
  const url = process.env.DATABASE_URL;
  if (!url) return; // DATABASE_URL is optional in some contexts (e.g. build-only)

  if (url.includes(':5432')) {
    throw new Error(
      'DATABASE_URL must use PgBouncer pooler port 6543, not direct connection port 5432. ' +
      'Change :5432 to :6543 in your connection string (SR-04).',
    );
  }
}

// d. EMAIL_ENCRYPTION_KEY must be present
function validateEmailEncryptionKey(): void {
  const key = process.env.EMAIL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('EMAIL_ENCRYPTION_KEY environment variable is not set. Required for email encryption at rest.');
  }
}
