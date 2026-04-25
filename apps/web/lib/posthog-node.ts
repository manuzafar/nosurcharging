// PostHog server-side SDK — used in API routes and server actions.
// Never imported in client components — would fail at module load.
//
// Lazy-init to keep the build step working when POSTHOG_NODE_KEY isn't
// available (e.g. CI build with only NEXT_PUBLIC_* vars). Same pattern
// as supabaseAdmin and getResend in the Calendly webhook.

import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient(): PostHog {
  if (!client) {
    const key = process.env.POSTHOG_NODE_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) throw new Error('[posthog-node] Key not configured');
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      flushAt: 1,        // Flush immediately — serverless environment
      flushInterval: 0,  // No background interval
    });
  }
  return client;
}

// Fire-and-await helper. Never throws — analytics failure must not break
// product flow. If the key is missing or PostHog is unreachable, we log
// to stderr and move on.
export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const ph = getClient();
    ph.capture({
      distinctId,
      event,
      properties: { country: 'AU', ...properties },
    });
    await ph.flush();
  } catch (err) {
    console.error('[posthog-node] Event failed:', event, err);
  }
}
