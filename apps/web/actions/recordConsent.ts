'use server';

// SR-05: Consents table is append-only. RLS denies UPDATE and DELETE.
// Records every consent acknowledgement with exact text shown to the user.

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashIP, getClientIP } from '@/lib/security';
import { getSessionId } from './createSession';

interface ConsentInput {
  consentType: 'disclaimer' | 'email_marketing' | 'data_collection';
  consentText: string;
  consentVersion: string;
  consented: boolean;
  sessionId?: string;
}

export async function recordConsent(input: ConsentInput): Promise<{ success: boolean; error?: string }> {
  // Use provided sessionId (from createSession) or fall back to cookie
  const sessionId = input.sessionId ?? (await getSessionId());
  if (!sessionId) {
    return { success: false, error: 'No active session' };
  }

  const reqHeaders = headers();
  const clientIP = getClientIP(reqHeaders);
  const ipHash = hashIP(clientIP);
  const userAgent = reqHeaders.get('user-agent') ?? '';

  const { error } = await supabaseAdmin.from('consents').insert({
    session_id: sessionId,
    consent_type: input.consentType,
    consent_text: input.consentText,
    consent_version: input.consentVersion,
    consented: input.consented,
    ip_hash: ipHash,
    user_agent: userAgent,
    country_code: 'AU',
  });

  if (error) {
    console.error('[consent] Insert failed:', error.message);
    return { success: false, error: 'Failed to record consent' };
  }

  return { success: true };
}
