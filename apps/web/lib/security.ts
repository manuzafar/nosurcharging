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

// validateConfig() moved to lib/validateConfig.ts — full implementation with
// card mix sum, IP_HASH_SECRET, DATABASE_URL port, EMAIL_ENCRYPTION_KEY checks.
