'use server';

// sendReportEmail — server action invoked by ArtifactCard's "Email me
// the PDF" button. Resolves the assessment, generates the PDF (M3
// stub for M2 — placeholder buffer), and sends it via Resend with
// the PDF as an attachment.
//
// Lazy-init pattern matches captureEmail.ts (CI builds without
// RESEND_API_KEY succeed). Never throws — returns { success } so the
// UI can surface a toast.
//
// M2 contract: returns success even with a stub PDF so the UI flow
// can be validated end-to-end. M3 swaps `generatePdfBuffer()` for the
// real React-PDF generator.

import { Resend } from 'resend';
import { getAssessment } from '@/actions/getAssessment';
import { sanitiseForHTML } from '@/lib/security';
import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

export interface SendReportEmailPayload {
  assessmentId: string;
  email: string;
}

export interface SendReportEmailResult {
  success: boolean;
  error?:
    | 'invalid_assessment_id'
    | 'invalid_email'
    | 'assessment_not_found'
    | 'send_failed'
    | 'unexpected_error';
}

const EMAIL_PATTERN = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)+$/;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// M2 stub — returns a tiny placeholder PDF buffer so the email flow
// works end-to-end. M3 replaces this with the real React-PDF generator.
async function generatePdfBuffer(_outputs: AssessmentOutputs): Promise<Buffer> {
  // Minimal valid 1-page PDF (~400 bytes) so Resend accepts the
  // attachment and inboxes render a "PDF" icon. The content is a
  // single line: "Your full report is being prepared. M3 ships the
  // finished version." Replaced wholesale in M3.
  const stub =
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    '4 0 obj<</Length 88>>stream\nBT /F1 12 Tf 72 720 Td (Your No Surcharging report is being prepared.) Tj ET\nendstream endobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000054 00000 n\n0000000101 00000 n\n0000000196 00000 n\n0000000324 00000 n\n' +
    'trailer<</Size 6/Root 1 0 R>>\nstartxref\n378\n%%EOF';
  return Buffer.from(stub, 'binary');
}

export async function sendReportEmail(
  payload: SendReportEmailPayload,
): Promise<SendReportEmailResult> {
  try {
    if (
      !payload.assessmentId ||
      !/^[0-9a-f-]{36}$/.test(payload.assessmentId)
    ) {
      return { success: false, error: 'invalid_assessment_id' };
    }

    const email = (payload.email ?? '').toLowerCase().trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      return { success: false, error: 'invalid_email' };
    }

    const result = await getAssessment(payload.assessmentId);
    if (!result.success || !result.data) {
      return { success: false, error: 'assessment_not_found' };
    }

    const outputs = result.data.outputs as AssessmentOutputs;
    const category = outputs.category as 1 | 2 | 3 | 4 | 5;
    const verdict = CATEGORY_VERDICTS[category];

    const resend = getResend();
    if (!resend) {
      console.warn(
        '[sendReportEmail] RESEND_API_KEY not set — stub success path',
      );
      // Return success in dev so the UI flow is testable without the key.
      // Production deploys must have RESEND_API_KEY.
      return { success: true };
    }

    const pdfBuffer = await generatePdfBuffer(outputs);

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'results@nosurcharging.com.au',
        to: sanitiseForHTML(email),
        subject: `Your No Surcharging report — Category ${category}: ${verdict}`,
        text:
          `Your full report is attached as a PDF.\n\n` +
          `You're in Situation ${category} — ${verdict}\n\n` +
          `We'll email you again on 30 October 2026 when the RBA's MSF benchmarks are published.\n\n` +
          `nosurcharging.com.au — independent payments intelligence.\n` +
          `Not financial advice. Figures are estimates based on the information you provided.`,
        attachments: [
          {
            filename: `nosurcharging-report-cat${category}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (err) {
      console.error(
        '[sendReportEmail] Resend send failed:',
        (err as Error).message,
      );
      return { success: false, error: 'send_failed' };
    }

    return { success: true };
  } catch (err) {
    console.error(
      '[sendReportEmail] unexpected error:',
      (err as Error).message,
    );
    return { success: false, error: 'unexpected_error' };
  }
}
