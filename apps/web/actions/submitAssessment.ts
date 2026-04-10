'use server';

// Assessment submission pipeline:
//   1. Validate session + idempotency key
//   2. Check if this exact submission was already processed (by idempotency key)
//   3. Check rate limit (SR-09: 100 per IP per 24 hours)
//   4. Hash IP (SR-02: never store raw IP)
//   5. resolveAssessmentInputs() → build fully resolved inputs
//   6. calculateMetrics() → produce outputs
//   7. INSERT with idempotency key (unique constraint prevents duplicates)
//
// Idempotency: client generates a UUID per submission attempt.
// DB unique constraint on idempotency_key prevents duplicates from
// StrictMode, double-clicks, or network retries.
// Multiple assessments per session ARE allowed (new tab = new key).
//
// calculateMetrics() NEVER receives raw form data directly.
// The resolver builds ResolvedAssessmentInputs first.

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashIP, getClientIP } from '@/lib/security';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSessionId } from './createSession';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { calculateMetrics } from '@nosurcharging/calculations/calculations';
import { buildActions } from '@nosurcharging/calculations/actions';
import { sanitiseForHTML } from '@/lib/security';
import type {
  RawAssessmentData,
  ResolutionContext,
  MerchantInputOverrides,
  AssessmentOutputs,
  ActionItem,
} from '@nosurcharging/calculations/types';

export interface AssessmentFormData {
  volume: number;
  planType: 'flat' | 'costplus';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  surchargeNetworks: string[];
  industry: string;
  psp: string;
  passThrough: number;
  merchantInput?: MerchantInputOverrides;
}

export interface AssessmentResult {
  success: boolean;
  assessmentId?: string;
  outputs?: AssessmentOutputs;
  actions?: ActionItem[];
  error?: string;
}

export async function submitAssessment(
  formData: AssessmentFormData,
  idempotencyKey: string,
): Promise<AssessmentResult> {
  // 1. Validate session
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'No active session. Please refresh and try again.' };
  }

  // 2. Validate idempotency key format
  if (!idempotencyKey || !/^[0-9a-f-]{36}$/.test(idempotencyKey)) {
    return { success: false, error: 'Invalid request. Please try again.' };
  }

  // 3. Check if this exact submission was already processed
  const { data: existing } = await supabaseAdmin
    .from('assessments')
    .select('id, outputs')
    .eq('idempotency_key', idempotencyKey)
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0]!;
    const prev = row.outputs as { actions?: ActionItem[] } & AssessmentOutputs;
    return { success: true, assessmentId: row.id, outputs: prev, actions: prev.actions ?? [] };
  }

  // 4. Rate limit check — SR-09: 100 per IP per 24 hours
  const reqHeaders = headers();
  const clientIP = getClientIP(reqHeaders);
  const ipHash = hashIP(clientIP);
  const rateLimitKey = `${ipHash}:assessment:24h`;
  const rateCheck = await checkRateLimit(rateLimitKey, 100, 24 * 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  // 5. Validate required fields
  if (!formData.psp) {
    return { success: false, error: 'PSP is required — assessment cannot be submitted without PSP selection.' };
  }

  // 6. Build raw assessment data
  const raw: RawAssessmentData = {
    volume: formData.volume,
    planType: formData.planType,
    msfRate: formData.msfRate,
    surcharging: formData.surcharging,
    surchargeRate: formData.surchargeRate,
    surchargeNetworks: formData.surchargeNetworks,
    industry: formData.industry,
    psp: formData.psp,
    passThrough: formData.passThrough,
    country: 'AU',
  };

  // 4. Build resolution context
  const ctx: ResolutionContext = {
    country: 'AU',
    industry: formData.industry,
    merchantInput: formData.merchantInput,
  };

  // 6. resolveAssessmentInputs() → calculateMetrics()
  //    The resolver builds fully resolved inputs.
  //    The engine receives resolved inputs only — never raw form data.
  const resolved = resolveAssessmentInputs(raw, ctx);
  const outputs = calculateMetrics(resolved);

  // 7. Build action list — sanitise PSP name before embedding in text (SR-08)
  //    Pass runtime context so the builder can interpolate [$X], [rate], [volume]
  //    placeholders into the per-category script copy (ux-spec §3.4).
  const safePsp = sanitiseForHTML(formData.psp);
  const actions = buildActions(outputs.category, safePsp, formData.industry, {
    volume: formData.volume,
    surchargeRate: formData.surchargeRate,
    surchargeRevenue: outputs.surchargeRevenue,
    icSaving: outputs.icSaving,
  });

  // 9. INSERT with idempotency key — use .select() to get generated ID
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('assessments')
    .insert({
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      country_code: 'AU',
      category: outputs.category,
      inputs: {
        ...raw,
        merchantInput: formData.merchantInput,
        resolvedCardMix: resolved.cardMix,
        resolutionTrace: resolved.resolutionTrace,
        confidence: resolved.confidence,
      },
      outputs: {
        ...outputs,
        actions,
      },
      ip_hash: ipHash,
    })
    .select('id')
    .single();

  if (insertError) {
    // Unique constraint violation = another request won the race — return that result
    if (insertError.code === '23505') {
      const { data: raceWinner } = await supabaseAdmin
        .from('assessments')
        .select('id, outputs')
        .eq('idempotency_key', idempotencyKey)
        .limit(1);

      if (raceWinner && raceWinner.length > 0) {
        const row = raceWinner[0]!;
        const prev = row.outputs as { actions?: ActionItem[] } & AssessmentOutputs;
        return { success: true, assessmentId: row.id, outputs: prev, actions: prev.actions ?? [] };
      }
    }

    console.error('[assessment] Insert failed:', insertError.message);
    return { success: false, error: 'Failed to save assessment. Please try again.' };
  }

  return { success: true, assessmentId: inserted.id, outputs, actions };
}
