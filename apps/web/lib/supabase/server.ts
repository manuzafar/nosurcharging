import { createClient, SupabaseClient } from '@supabase/supabase-js';

// SR-03: Service role client — server only
// NEVER import this file from client components or files with 'use client'
// ESLint rule enforces this restriction
//
// Lazy-initialized: the client is created on first access, not at import time.
// This prevents build failures in CI where SUPABASE_SERVICE_ROLE_KEY is not set
// (the build only needs NEXT_PUBLIC_* vars for static page generation).

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables',
    );
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

// Backward-compatible export — lazy getter
// All existing imports of `supabaseAdmin` continue to work.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
