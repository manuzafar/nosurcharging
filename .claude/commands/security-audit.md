Audit the codebase against all 12 security requirements from docs/security/security-requirements.md.

For each SR rule, check compliance:

- SR-01: Session IDs are server-generated via randomUUID() in createSession.ts. Cookie is HttpOnly, Secure, SameSite=Strict.
- SR-02: hashIP() uses HMAC-SHA256 with IP_HASH_SECRET. Throws if secret not set. Raw IPs never stored in DB or logs.
- SR-03: supabase/server.ts uses SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix). ESLint rule blocks client imports. Grep for any client-side import of server.ts.
- SR-04: All database connection strings use port 6543 (PgBouncer pooler), not 5432.
- SR-05: Consents table RLS: deny_update and deny_delete policies exist in database-schema.sql.
- SR-06: Security headers in next.config.ts: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, CSP (whitelists plausible.io).
- SR-07: CORS uses exact origin matching (allowedOrigins.includes(origin)), not substring matching.
- SR-08: DOMPurify or sanitiseForHTML used on PSP names and dynamic content before rendering.
- SR-09: Rate limiting: assessment 100/IP/24hr, email 1/session + 10/IP/hr.
- SR-10: Privacy policy exists at /privacy.
- SR-11: Sentry with PII scrubbing in beforeSend (no email, raw IP, full session ID).
- SR-12: No PII in logs. Check for console.log/error calls that might leak email, IP, session ID, financial inputs.

Report: PASS, FAIL, or NOT YET IMPLEMENTED for each rule.
