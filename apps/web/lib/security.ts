import { createHmac } from 'crypto';

// SR-02: IP hashing with HMAC-SHA256 + secret salt
// Throws if IP_HASH_SECRET is not set. Raw IPs are never stored.

export function hashIP(ip: string): string {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    throw new Error('IP_HASH_SECRET environment variable is not set');
  }
  return createHmac('sha256', secret).update(ip).digest('hex');
}

// Extract client IP from request headers
// Cloudflare CF-Connecting-IP takes priority, then X-Forwarded-For

export function getClientIP(headers: Headers): string {
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIP = forwardedFor.split(',')[0];
    if (firstIP) return firstIP.trim();
  }

  return '0.0.0.0';
}

// SR-08: Sanitise dynamic content before rendering
// Used for PSP names and other user-influenced content in action list HTML

export function sanitiseForHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validates Tier 2 CALC_* env vars at startup.
// Throws if card mix env vars are set but don't sum to ~1.0.
// Called from server-side startup (layout.tsx or instrumentation).

export function validateConfig(): void {
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

  // Only validate sum if at least one env var is set
  const setValues = values.filter((v): v is number => v !== null);
  if (setValues.length === 0) return;

  // If any are set, all should be set
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
