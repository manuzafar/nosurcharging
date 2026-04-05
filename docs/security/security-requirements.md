# Security Requirements
## nosurcharging.com.au

These requirements are non-negotiable. Every item has a severity rating and must be implemented before launch.

---

## SR-01 — Server-side session generation [Critical]

Session IDs must be generated server-side. The client never constructs or generates a session ID.

**Implementation:**

```typescript
// actions/createSession.ts
'use server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function createSession() {
  const sessionId = randomUUID(); // Server-generated UUID

  cookies().set('session_id', sessionId, {
    httpOnly: true,    // Client JavaScript cannot read this
    secure: true,      // HTTPS only
    sameSite: 'strict', // No cross-site sending
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return sessionId;
}
```

**Why:** A client-generated session ID can be fabricated. An attacker can submit consent records for sessions they do not own, replay sessions, or enumerate valid session IDs.

---

## SR-02 — IP hashing with secret salt [Critical]

IP addresses must be hashed using HMAC-SHA256 with a secret salt before storage. Plain SHA-256 without salt is reversible via rainbow table.

**Implementation:**

```typescript
// lib/security.ts
import { createHmac } from 'crypto';

export function hashIP(ip: string): string {
  if (!process.env.IP_HASH_SECRET) {
    throw new Error('IP_HASH_SECRET environment variable not set');
  }
  return createHmac('sha256', process.env.IP_HASH_SECRET)
    .update(ip)
    .digest('hex');
}

export function getClientIP(request: Request): string {
  // Cloudflare passes real IP in CF-Connecting-IP
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    'unknown'
  );
}
```

**Never:** Store raw IP addresses in logs, database, or error tracking.

---

## SR-03 — Supabase client separation [Critical]

The service role key must never be importable from browser code.

**Implementation:**

```typescript
// lib/supabase/server.ts
// This file may only be imported from:
// - Server components (page.tsx, layout.tsx in RSC context)
// - Server actions (actions/*.ts)
// - API routes (app/api/*/route.ts)
// NEVER from client components

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,            // No NEXT_PUBLIC_ prefix
  process.env.SUPABASE_SERVICE_ROLE_KEY! // No NEXT_PUBLIC_ prefix
);
```

```typescript
// lib/supabase/client.ts
// Safe for browser — uses anon key with RLS enforcement

import { createBrowserClient } from '@supabase/ssr';

export const supabaseClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**ESLint rule to add:**
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["*/supabase/server"],
        "message": "supabaseAdmin may only be imported in server-side files"
      }]
    }]
  }
}
```

---

## SR-04 — Database connection pooling [High]

All Supabase connections must use the PgBouncer pooler. Direct connections exhaust Postgres connection limits under load.

**Correct:** `DATABASE_URL=postgresql://postgres:[password]@[project].supabase.co:6543/postgres`
**Wrong:** `DATABASE_URL=postgresql://postgres:[password]@[project].supabase.co:5432/postgres`

The difference is port 6543 (pooler) vs 5432 (direct). This cannot be an afterthought — set it before the first database connection is made.

---

## SR-05 — RLS append-only consents [Critical]

The consents table must be append-only at the database level. Application-layer enforcement is not sufficient — it can be bypassed by a developer mistake or direct database access.

The following policies must exist (from database-schema.sql):

```sql
CREATE POLICY "consents_deny_update"
  ON consents FOR UPDATE USING (false);

CREATE POLICY "consents_deny_delete"
  ON consents FOR DELETE USING (false);
```

**Do not remove these policies.** They are not optional. If a legitimate data correction is needed (e.g. a test record), it must be done via Supabase dashboard with the service role, never via application code.

---

## SR-06 — Security headers [High]

Add to next.config.ts before first production deploy:

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self' https://[project].supabase.co https://plausible.io",
      "frame-ancestors 'none'",
    ].join('; ')
  }
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  }
};
```

---

## SR-07 — CORS exact origin matching [High]

CORS must use exact string matching, not substring or regex matching.

**Correct:**
```typescript
const allowedOrigins = ['https://nosurcharging.com.au', 'https://www.nosurcharging.com.au'];
const origin = request.headers.get('origin');
if (origin && allowedOrigins.includes(origin)) {
  // Allow
}
```

**Wrong:**
```typescript
if (origin && origin.includes('nosurcharging.com.au')) { // VULNERABLE
```

A subdomain attack (`nosurcharging.com.au.attacker.com`) would pass the `includes()` check.

---

## SR-08 — XSS prevention for dynamic content [High]

The PSP name from user selection and the industry type appear inline in the action list HTML. These must be sanitised before rendering.

**Implementation:**

```typescript
// Install: npm install dompurify isomorphic-dompurify
import DOMPurify from 'isomorphic-dompurify';

export function sanitiseForHTML(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
```

The PSP selector in Phase 1 is a closed enum (Stripe, Square, Tyro, etc.) — no free-text input. The "Other" option must not allow a custom PSP name in Phase 1. Free-text PSP entry is Phase 2, with sanitisation enforced.

---

## SR-09 — Rate limiting [High]

Rate limiting uses the Supabase `rate_limits` table (from database-schema.sql). No Redis needed in Phase 1.

**Limits:**
- Assessment submission: 100 per IP per 24 hours
- Email capture: 1 per session, 10 per IP per hour

**Implementation:**

```typescript
// lib/rateLimit.ts
import { hashIP } from './security';
import { supabaseAdmin } from './supabase/server';

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowHours: number
): Promise<{ allowed: boolean; remaining: number }> {
  const ipHash = hashIP(ip);
  const windowEnd = new Date(Date.now() + windowHours * 60 * 60 * 1000);
  const key = `${ipHash}:${endpoint}:${Math.floor(Date.now() / (windowHours * 3600000))}`;

  const { data } = await supabaseAdmin.rpc('upsert_rate_limit', {
    p_key: key,
    p_window_end: windowEnd.toISOString(),
  });

  const count = data as number;
  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}
```

---

## SR-10 — Email encryption at rest [Medium]

Email addresses must be encrypted before storage using pgcrypto.

**Implementation (server action):**

```typescript
// In captureEmail.ts server action
const { data } = await supabaseAdmin.rpc('encrypt_email', {
  email: emailInput,
  key: process.env.EMAIL_ENCRYPTION_KEY,
});
// Store data.encrypted_email in email_signups.email_encrypted
```

**SQL function:**

```sql
CREATE OR REPLACE FUNCTION encrypt_email(email text, key text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_encrypt(email, key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Decryption (only when sending October benchmarking email):**

```sql
SELECT pgp_sym_decrypt(email_encrypted::bytea, current_setting('app.email_key'))
FROM email_signups
WHERE country_code = 'AU';
```

---

## SR-11 — Privacy Policy page [Medium]

The page `/privacy` must exist and be live before any data collection begins. It must be linked from:
- The email capture form (plain text link, not a modal)
- The site footer
- The disclaimer consent checkbox text

Content requirements:
- What is collected (session data, email if provided)
- What is done with it (assessment generation, October email if consented)
- What is NOT done (selling to PSPs, sharing with payment providers)
- Data deletion request process (email to privacy@nosurcharging.com.au)
- Data retention period

---

## SR-12 — Sentry error tracking with PII scrubbing [Medium]

Add Sentry before production launch. Configure PII scrubbing before initialising.

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Strip all PII before sending to Sentry
    if (event.request?.data) {
      delete event.request.data.email;
      delete event.request.data.ip;
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

---

## Secrets rotation schedule

| Secret | Rotation | Action on rotation |
|---|---|---|
| SUPABASE_SERVICE_ROLE_KEY | 180 days | Rotate in Supabase dashboard, update Railway |
| IP_HASH_SECRET | 365 days | Rotation changes all future hashes; historical data unaffected |
| EMAIL_ENCRYPTION_KEY | Never (or re-encrypt all emails) | Only rotate if compromised |
| RESEND_API_KEY | 90 days | Generate new key in Resend, update Railway |
| INTERNAL_API_KEY (Phase 2) | 90 days | Update both web and api Railway services simultaneously |
| ANTHROPIC_API_KEY (Phase 2) | 90 days | Generate new key in Anthropic console |

---

*Security Requirements v1.0 · nosurcharging.com.au · April 2026*
