'use server';

// Merchant feedback capture — expanded inline under the P&L number.
// SPRINT_BRIEF.md Sprint 1 / RESULTS-03.
// No DB write. Sends a single email via Resend to FEEDBACK_EMAIL.
// SR-12: we log nothing about the message or email — only the outcome.

import { Resend } from 'resend';
import { getSessionId } from './createSession';

// Lazy-init: Resend throws if API key is missing at construction.
// In CI, RESEND_API_KEY is not set during build (only at runtime).
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface SubmitFeedbackInput {
  category: 1 | 2 | 3 | 4;
  volume: number;
  assessmentId?: string;
  email?: string;
  message: string;
}

export interface SubmitFeedbackResult {
  success: boolean;
  error?: string;
}

function formatVolumeShort(volume: number): string {
  if (volume >= 1_000_000) {
    const m = volume / 1_000_000;
    const formatted = m >= 10 ? m.toFixed(0) : m.toFixed(1);
    return `$${formatted}M`;
  }
  if (volume >= 1_000) {
    return `$${Math.round(volume / 1_000)}K`;
  }
  return `$${Math.round(volume).toLocaleString('en-AU')}`;
}

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<SubmitFeedbackResult> {
  // Validate session — stops unsolicited posts from non-users
  const sessionId = await getSessionId();
  if (!sessionId) {
    return { success: false, error: 'No active session' };
  }

  const message = (input.message ?? '').trim();
  if (!message) {
    return { success: false, error: 'Please tell us what looks off.' };
  }
  if (message.length > 2000) {
    return { success: false, error: 'Please keep your note under 2,000 characters.' };
  }

  const email = (input.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const volumeLabel = formatVolumeShort(input.volume);
  const to = process.env.FEEDBACK_EMAIL ?? 'manuzafar@gmail.com';
  const assessmentLine = input.assessmentId
    ? `Assessment: ${input.assessmentId}`
    : 'Assessment: (none)';

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM ?? 'hello@nosurcharging.com.au',
      to,
      replyTo: email || undefined,
      subject: `[Feedback] Cat ${input.category} merchant — ${volumeLabel} volume`,
      text: [
        `Category: ${input.category}`,
        `Volume: ${volumeLabel}`,
        `Reply-to: ${email || '(not provided)'}`,
        assessmentLine,
        `Session: ${sessionId.slice(-8)}`,
        '',
        '— Message —',
        message,
      ].join('\n'),
    });
  } catch (err) {
    console.error('[feedback] Resend failed:', (err as Error).message);
    return { success: false, error: 'Could not send feedback. Try again.' };
  }

  return { success: true };
}
