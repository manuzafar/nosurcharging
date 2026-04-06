// Calendly webhook handler — invitee.created events.
// Validates signature, stores consulting lead, sends prep + notification emails.
// Returns 200 even on partial failure (webhook resilience).

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  // 1. Verify webhook signature
  const signature = request.headers.get('Calendly-Webhook-Signature');
  const body = await request.text();

  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[calendly] CALENDLY_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse payload
  let payload: {
    event: string;
    payload: {
      invitee: {
        name?: string;
        email?: string;
      };
      event: {
        start_time?: string;
      };
      questions_and_answers?: Array<{ question: string; answer: string }>;
    };
  };

  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3. Only handle invitee.created — ignore other event types gracefully
  if (payload.event !== 'invitee.created') {
    return NextResponse.json({ ok: true });
  }

  const invitee = payload.payload.invitee;
  const eventTime = payload.payload.event?.start_time;
  const answers = payload.payload.questions_and_answers ?? [];

  // 4. Store in consulting_leads
  const encryptionKey = process.env.EMAIL_ENCRYPTION_KEY;
  if (invitee.email && encryptionKey) {
    const { error: insertError } = await supabaseAdmin.from('consulting_leads').insert({
      name: invitee.name ?? null,
      email_encrypted: await encryptEmail(invitee.email, encryptionKey),
      country_code: 'AU',
      event_time: eventTime ?? null,
      source: 'calendly',
      status: 'booked',
    });

    if (insertError) {
      // Log error but still return 200 (webhook resilience)
      console.error('[calendly] Insert failed:', insertError.message);
    }
  }

  // 5. Send prep email to merchant
  if (invitee.email) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'hello@nosurcharging.com.au',
        to: invitee.email,
        subject: 'Your payments discovery call — a few things to have ready',
        text: [
          `Hi${invitee.name ? ' ' + invitee.name : ''},`,
          '',
          `Looking forward to speaking${eventTime ? ' on ' + new Date(eventTime).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}.`,
          '',
          'To make the most of our 30 minutes, it would help to have these to hand:',
          '',
          '1. Your last 3 months of PSP statements (PDFs are fine)',
          '2. Your approximate monthly card volume',
          '3. Your current PSP and plan type (flat rate or interchange-plus)',
          '',
          "If you don't have these handy, no worries — we can work with what you know.",
          '',
          'See you then.',
          '',
          'nosurcharging.com.au',
        ].join('\n'),
      });
    } catch (emailErr) {
      console.error('[calendly] Prep email failed:', (emailErr as Error).message);
    }
  }

  // 6. Send notification email to internal recipient
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (notificationEmail) {
    const answersText = answers
      .map((qa) => `${qa.question}: ${qa.answer}`)
      .join('\n');

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'hello@nosurcharging.com.au',
        to: notificationEmail,
        subject: `New discovery call booked — ${invitee.name ?? 'Unknown'}`,
        text: [
          `Name: ${invitee.name ?? 'Not provided'}`,
          `Email: ${invitee.email ?? 'Not provided'}`,
          `Event time: ${eventTime ?? 'Not provided'}`,
          '',
          answers.length > 0 ? 'Intake answers:' : '',
          answersText,
        ].join('\n'),
      });
    } catch (emailErr) {
      console.error('[calendly] Notification email failed:', (emailErr as Error).message);
    }
  }

  // 7. Always return 200 — webhook must not retry on partial failures
  return NextResponse.json({ ok: true });
}

// Encrypt email using Supabase pgcrypto
async function encryptEmail(email: string, key: string): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('pgp_sym_encrypt_email', {
    p_email: email,
    p_key: key,
  });

  if (error || !data) {
    // Fallback: store a marker indicating encryption failed
    console.error('[calendly] Email encryption failed:', error?.message);
    return '[encryption_failed]';
  }

  return data as string;
}
