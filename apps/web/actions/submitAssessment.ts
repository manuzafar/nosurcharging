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
import { calculateMetrics, calculateZeroCostMetrics } from '@nosurcharging/calculations/calculations';
import { buildActions } from '@nosurcharging/calculations/actions';
import { detectStrategicRate } from '@nosurcharging/calculations/categories';
import { sanitiseForHTML } from '@/lib/security';
import type {
  RawAssessmentData,
  ResolutionContext,
  MerchantInputOverrides,
  AssessmentOutputs,
  ZeroCostOutputs,
  ActionItem,
} from '@nosurcharging/calculations/types';

export interface AssessmentFormData {
  volume: number;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost' | 'strategic_rate';
  msfRate: number;
  surcharging: boolean;
  surchargeRate: number;
  surchargeNetworks: string[];
  industry: string;
  psp: string;
  passThrough: number;
  merchantInput?: MerchantInputOverrides;
  msfRateMode?: 'unselected' | 'market_estimate' | 'custom';
  customMSFRate?: number;
  blendedDebitRate?: number;
  blendedCreditRate?: number;
  planTypeUnknown?: boolean;
}

export interface AssessmentResult {
  success: boolean;
  assessmentId?: string;
  outputs?: AssessmentOutputs | ZeroCostOutputs;
  actions?: ActionItem[];
  strategicRateExit?: boolean;
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

  // 6. Strategic rate interception — before resolve/calculate pipeline
  const safePsp = sanitiseForHTML(formData.psp);
  const strategicCheck = formData.planTypeUnknown
    ? { detected: false, triggerReason: null as string | null }
    : detectStrategicRate(formData.planType, formData.volume, formData.psp);
  if (strategicCheck.detected) {
    const { data: inserted } = await supabaseAdmin
      .from('assessments')
      .insert({
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        country_code: 'AU',
        category: 5,
        variant_type: 'strategic_rate',
        inputs: { volume: formData.volume, psp: formData.psp, industry: formData.industry, planType: formData.planType },
        outputs: { strategic_rate: true, triggerReason: strategicCheck.triggerReason },
        ip_hash: ipHash,
      })
      .select('id')
      .single();
    return { success: true, assessmentId: inserted?.id, strategicRateExit: true };
  }

  // 7. Build raw assessment data
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
    msfRateMode: formData.msfRateMode,
    customMSFRate: formData.customMSFRate,
  };

  // 8. Build resolution context
  const ctx: ResolutionContext = {
    country: 'AU',
    industry: formData.industry,
    merchantInput: {
      ...formData.merchantInput,
      blendedRates: formData.planType === 'blended'
        ? { debitRate: formData.blendedDebitRate, creditRate: formData.blendedCreditRate }
        : undefined,
    },
  };

  // 9. resolveAssessmentInputs() → route to correct engine
  const resolved = resolveAssessmentInputs(raw, ctx);
  const outputs: AssessmentOutputs | ZeroCostOutputs =
    formData.planType === 'zero_cost'
      ? calculateZeroCostMetrics(resolved)
      : calculateMetrics(resolved);

  // 10. Build action list
  const categoryArg = formData.planType === 'zero_cost'
    ? ('zero_cost' as const)
    : (outputs as AssessmentOutputs).category;
  const actions = buildActions(categoryArg, safePsp, formData.industry, {
    volume: formData.volume,
    surchargeRate: formData.surchargeRate,
    surchargeRevenue: 'surchargeRevenue' in outputs ? outputs.surchargeRevenue : 0,
    icSaving: 'icSaving' in outputs ? outputs.icSaving : 0,
  }, formData.planType === 'strategic_rate' ? undefined : formData.planType as 'flat' | 'costplus' | 'blended' | 'zero_cost');

  // 11. Category and variant_type sentinels
  const categoryValue = formData.planType === 'zero_cost'
    ? 0  // sentinel — see migration 005
    : (outputs as AssessmentOutputs).category;
  const variantType = formData.planType === 'zero_cost' ? 'zero_cost' : 'standard';

  // 12. INSERT with idempotency key — use .select() to get generated ID
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('assessments')
    .insert({
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      country_code: 'AU',
      category: categoryValue,
      variant_type: variantType,
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
