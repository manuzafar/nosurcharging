'use server';

// Email capture for the 30 October benchmarking email.
// SR-09: Rate limit 1 per session, 10 per IP per hour.
// Email encrypted at rest via pgp_sym_encrypt.
// SR-12: Never log email addresses.

import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { hashIP, getClientIP } from '@/lib/security';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSessionId } from './createSession';
import { recordConsent } from './recordConsent';

const EMAIL_CONSENT_TEXT =
  'One email on 30 October when the published MSF data drops. Not shared with any payment provider. Unsubscribe from the email itself.';
const EMAIL_CONSENT_VERSION = 'v1.0';

export interface CaptureEmailResult {
  success: boolean;
  error?: string;
}

export async function captureEmail(
  email: string,
  assessmentId?: string,
): Promise<CaptureEmailResult> {
  // Validate session
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'No active session' };
  }

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const reqHeaders = headers();
  const clientIP = getClientIP(reqHeaders);
  const ipHash = hashIP(clientIP);

  // SR-09: Rate limit — 1 per session
  const sessionKey = `${sessionId}:email:session`;
  const sessionCheck = await checkRateLimit(sessionKey, 1, 24 * 60 * 60 * 1000);
  if (!sessionCheck.allowed) {
    return { success: false, error: "You've already signed up. One email on 30 October." };
  }

  // SR-09: Rate limit — 10 per IP per hour
  const ipKey = `${ipHash}:email:1h`;
  const ipCheck = await checkRateLimit(ipKey, 10, 60 * 60 * 1000);
  if (!ipCheck.allowed) {
    return { success: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  // Record email marketing consent (append-only)
  const consentResult = await recordConsent({
    consentType: 'email_marketing',
    consentText: EMAIL_CONSENT_TEXT,
    consentVersion: EMAIL_CONSENT_VERSION,
    consented: true,
  });

  if (!consentResult.success) {
    return { success: false, error: 'Failed to record consent' };
  }

  // Encrypt email at rest via pgcrypto pgp_sym_encrypt.
  // Uses raw SQL through Supabase RPC since pgp_sym_encrypt is a DB function.
  const encryptionKey = process.env.EMAIL_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error('[email] EMAIL_ENCRYPTION_KEY not set');
    return { success: false, error: 'Configuration error' };
  }

  // INSERT with email encrypted inline via pgp_sym_encrypt
  const { error: insertError } = await supabaseAdmin.rpc('insert_email_signup', {
    p_email: email,
    p_encryption_key: encryptionKey,
    p_session_id: sessionId,
    p_country_code: 'AU',
    p_signup_source: 'assessment_complete',
    p_assessment_id: assessmentId ?? null,
  });

  if (insertError) {
    console.error('[email] Insert failed:', insertError.message);
    return { success: false, error: 'Failed to save email. Please try again.' };
  }

  return { success: true };
}
