'use server';

// Fetches assessment results by ID.
// Used by the results page to load data from a URL search param.
// Service role bypasses RLS (assessments table has SELECT USING(false) for anon).
//
// Ruthless Cut M3 — 48h retention. Rows older than `expires_at` are
// deleted inline (best-effort) and the caller receives an explicit
// "expired" state. A scheduled cron sweep is deferred per PB-2; until
// then the on-load path is the only deletion mechanism.

import { supabaseAdmin } from '@/lib/supabase/server';
import type { AssessmentOutputs, ActionItem } from '@nosurcharging/calculations/types';

export interface StoredAssessment {
  id: string;
  category: number;
  // variant_type retained for back-compat queries on legacy zero_cost rows.
  // Post-migration-007, category alone is authoritative for routing.
  variant_type: 'standard' | 'zero_cost' | 'strategic_rate';
  inputs: Record<string, unknown>;
  outputs: AssessmentOutputs & { actions?: ActionItem[] };
  created_at: string;
  // Captured at the email gate (post-Step-4 / pre-reveal). Optional —
  // null when the merchant skipped. ArtifactCard reads this as the
  // pre-fill value for the "Email me the PDF" form.
  email: string | null;
  // 48h TTL. After this timestamp the row is deleted on next access.
  // Always present from migration 009 onwards.
  expires_at: string;
}

export type GetAssessmentResult =
  | { success: true; data: StoredAssessment }
  | { success: false; error: 'invalid_id' | 'not_found' | 'expired' };

export async function getAssessment(
  assessmentId: string,
): Promise<GetAssessmentResult> {
  if (!assessmentId || !/^[0-9a-f-]{36}$/.test(assessmentId)) {
    return { success: false, error: 'invalid_id' };
  }

  const { data, error } = await supabaseAdmin
    .from('assessments')
    .select(
      'id, category, variant_type, inputs, outputs, created_at, email, expires_at',
    )
    .eq('id', assessmentId)
    .single();

  if (error || !data) {
    return { success: false, error: 'not_found' };
  }

  // Check-on-load expiry. If the row is past its TTL, delete it
  // inline (best-effort — failure to delete must not block the
  // expired response) and return the explicit expired state.
  const expiresAt = new Date(data.expires_at as string);
  if (Number.isFinite(expiresAt.getTime()) && expiresAt < new Date()) {
    // Best-effort delete. We don't await tightly — surfacing an
    // expired state to the merchant is more important than a hard
    // guarantee that the row is gone before we respond.
    void supabaseAdmin.from('assessments').delete().eq('id', assessmentId);
    return { success: false, error: 'expired' };
  }

  return {
    success: true,
    data: data as StoredAssessment,
  };
}
