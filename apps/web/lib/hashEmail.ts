// SHA-256 hash of email for PostHog identity. The hash is stable for the
// same email so PostHog can merge anonymous and identified events for the
// same merchant across sessions. Raw email is never sent to analytics.

export async function hashEmail(email: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(email.toLowerCase().trim()),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
