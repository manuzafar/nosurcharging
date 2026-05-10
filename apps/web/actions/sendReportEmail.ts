'use server';

// sendReportEmail — server action invoked by ArtifactCard's "Email me
// the PDF" button. Resolves the assessment, generates the React-PDF
// report (lib/pdf/report.tsx), and sends it via Resend with the PDF
// as an attachment.
//
// Lazy-init pattern matches captureEmail.ts (CI builds without
// RESEND_API_KEY succeed). Never throws — returns { success } so the
// UI can surface a toast.
//
// M3 wires the real generator. The previous M2 stub returned a
// 400-byte placeholder buffer; that's now replaced.

import { Resend } from 'resend';
import { getAssessment } from '@/actions/getAssessment';
import { sanitiseForHTML } from '@/lib/security';
import { resolveAssessmentInputs } from '@nosurcharging/calculations/rules/resolver';
import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import type {
  AssessmentOutputs,
  ActionItem,
  RawAssessmentData,
  ResolutionContext,
} from '@nosurcharging/calculations/types';
import { generateReportPdf } from '@/lib/pdf/report';

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
    if (!result.success) {
      // Treat 'expired' the same as 'not_found' from the client's
      // perspective — the assessment data is no longer retrievable.
      // The UI surfaces a generic toast either way.
      return { success: false, error: 'assessment_not_found' };
    }

    const stored = result.data;
    const outputs = stored.outputs as AssessmentOutputs;
    const actions =
      (stored.outputs as { actions?: ActionItem[] }).actions ?? [];
    const category = outputs.category as 1 | 2 | 3 | 4 | 5;
    const verdict = CATEGORY_VERDICTS[category];

    // Strategic-rate variant has no calculation surface to render — bail
    // out cleanly. The merchant on this path doesn't have a P&L story.
    if (stored.variant_type === 'strategic_rate') {
      return { success: false, error: 'assessment_not_found' };
    }

    const resend = getResend();
    if (!resend) {
      console.warn(
        '[sendReportEmail] RESEND_API_KEY not set — stub success path',
      );
      // Return success in dev so the UI flow is testable without the key.
      // Production deploys must have RESEND_API_KEY.
      return { success: true };
    }

    // Resolve the inputs so the assumptions section can render the
    // resolution trace. Skip for zero-cost (the resolver short-circuits).
    const storedInputs = stored.inputs as Record<string, unknown>;
    const planType =
      (storedInputs.planType as RawAssessmentData['planType']) ?? 'flat';
    const rawForResolve: RawAssessmentData = {
      volume: (storedInputs.volume as number) ?? 0,
      planType,
      msfRate: (storedInputs.msfRate as number) ?? 0.014,
      surcharging: (storedInputs.surcharging as boolean) ?? false,
      surchargeRate: (storedInputs.surchargeRate as number) ?? 0,
      surchargeNetworks:
        (storedInputs.surchargeNetworks as string[]) ?? [],
      industry: (storedInputs.industry as string) ?? 'other',
      psp: sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown'),
      passThrough: 0,
      country: 'AU',
    };
    const ctx: ResolutionContext = {
      country: 'AU',
      industry: rawForResolve.industry,
      merchantInput:
        storedInputs.merchantInput as ResolutionContext['merchantInput'],
    };
    const resolved =
      planType === 'zero_cost' ? null : resolveAssessmentInputs(rawForResolve, ctx);

    const pdfBuffer = await generateReportPdf({
      outputs,
      actions,
      pspName: rawForResolve.psp,
      volume: rawForResolve.volume,
      // Strategic-rate already short-circuited above; this cast just
      // narrows the planType union for the PDF generator's signature.
      planType: planType as 'flat' | 'costplus' | 'blended' | 'zero_cost',
      msfRate: rawForResolve.msfRate,
      surcharging: rawForResolve.surcharging,
      industry: rawForResolve.industry,
      resolutionTrace: resolved?.resolutionTrace ?? {},
    });

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
