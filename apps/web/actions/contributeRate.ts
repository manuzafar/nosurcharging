'use server';

// PSP Rate Registry — anonymous 3-field contribution form.
// Phase 1: trust_score=1, quarantined=false.
// Trust scoring and public display deferred to Phase 2.
// Rate limited: 1 per assessment_id.

import { supabaseAdmin } from '@/lib/supabase/server';
import { getSessionId } from './createSession';

export interface ContributeRateInput {
  assessmentId: string;
  pspName: string;
  planType: 'flat' | 'costplus';
  effectiveRatePct: number;
  volumeBand: '0-100k' | '100k-1m' | '1m-10m' | '10m-50m' | '50m+';
}

export interface ContributeRateResult {
  success: boolean;
  error?: string;
}

export async function contributeRate(
  input: ContributeRateInput,
): Promise<ContributeRateResult> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'No active session' };
  }

  // Validate assessment_id format
  if (!input.assessmentId || !/^[0-9a-f-]{36}$/.test(input.assessmentId)) {
    return { success: false, error: 'Invalid assessment ID' };
  }

  // Validate rate range
  if (input.effectiveRatePct <= 0 || input.effectiveRatePct > 10) {
    return { success: false, error: 'Rate must be between 0% and 10%' };
  }

  // Validate assessment exists
  const { data: assessment } = await supabaseAdmin
    .from('assessments')
    .select('id')
    .eq('id', input.assessmentId)
    .limit(1);

  if (!assessment || assessment.length === 0) {
    return { success: false, error: 'Assessment not found' };
  }

  // Rate limit: 1 per assessment_id (check if already contributed)
  const { data: existing } = await supabaseAdmin
    .from('psp_rate_registry')
    .select('id')
    .eq('assessment_id', input.assessmentId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'You have already contributed a rate for this assessment' };
  }

  // Convert rate percentage to decimal proportion (e.g. 1.4% → 0.014)
  const { error: insertError } = await supabaseAdmin.from('psp_rate_registry').insert({
    assessment_id: input.assessmentId,
    psp_name: input.pspName,
    plan_type: input.planType,
    country_code: 'AU',
    volume_band: input.volumeBand,
    effective_rate_pct: input.effectiveRatePct / 100,
    trust_score: 1,
    quarantined: false,
  });

  if (insertError) {
    console.error('[rate-registry] Insert failed:', insertError.message);
    return { success: false, error: 'Failed to save rate contribution' };
  }

  return { success: true };
}
