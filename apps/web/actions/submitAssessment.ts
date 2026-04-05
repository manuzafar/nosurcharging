'use server';

// Assessment submission pipeline:
//   1. Validate session
//   2. Check rate limit (SR-09: 100 per IP per 24 hours)
//   3. Hash IP (SR-02: never store raw IP)
//   4. resolveAssessmentInputs() → build fully resolved inputs
//   5. calculateMetrics() → produce outputs
//   6. INSERT into assessments table
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
  outputs?: AssessmentOutputs;
  actions?: ActionItem[];
  error?: string;
}

export async function submitAssessment(
  formData: AssessmentFormData,
): Promise<AssessmentResult> {
  // 1. Validate session
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'No active session. Please refresh and try again.' };
  }

  // 2. Rate limit check — SR-09: 100 per IP per 24 hours
  const reqHeaders = headers();
  const clientIP = getClientIP(reqHeaders);
  const ipHash = hashIP(clientIP);
  const rateLimitKey = `${ipHash}:assessment:24h`;
  const rateCheck = await checkRateLimit(rateLimitKey, 100, 24 * 60 * 60 * 1000);
  if (!rateCheck.allowed) {
    return { success: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  // 3. Build raw assessment data
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

  // 5. resolveAssessmentInputs() → calculateMetrics()
  //    The resolver builds fully resolved inputs.
  //    The engine receives resolved inputs only — never raw form data.
  const resolved = resolveAssessmentInputs(raw, ctx);
  const outputs = calculateMetrics(resolved);

  // 6. Build action list
  const actions = buildActions(outputs.category, formData.psp, formData.industry);

  // 7. INSERT into assessments table
  const { error: insertError } = await supabaseAdmin.from('assessments').insert({
    session_id: sessionId,
    country_code: 'AU',
    category: outputs.category,
    inputs: {
      ...raw,
      merchantInput: formData.merchantInput,
      resolvedCardMix: resolved.cardMix,
      confidence: resolved.confidence,
    },
    outputs: {
      ...outputs,
      actions,
    },
    ip_hash: ipHash,
  });

  if (insertError) {
    console.error('[assessment] Insert failed:', insertError.message);
    return { success: false, error: 'Failed to save assessment. Please try again.' };
  }

  return { success: true, outputs, actions };
}
