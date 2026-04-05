import { supabaseAdmin } from './supabase/server';

// SR-09: Rate limiting — Supabase-backed, no Redis needed
// Assessment: 100 per IP per 24 hours
// Email capture: 1 per session, 10 per IP per hour

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const windowEnd = new Date(Date.now() + windowMs).toISOString();

  const { data, error } = await supabaseAdmin.rpc('upsert_rate_limit', {
    p_key: key,
    p_window_end: windowEnd,
  });

  if (error) {
    // Fail open — allow request but log error
    console.error('[rate-limit] Error checking rate limit:', error.message);
    return { allowed: true, count: 0, limit };
  }

  const count = data as number;
  return { allowed: count <= limit, count, limit };
}
