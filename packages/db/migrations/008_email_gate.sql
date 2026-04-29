-- Migration 008: Email gate — add email and marketing-consent fields
-- to the assessments table.
--
-- Apply via Supabase SQL editor: staging FIRST → verify → production.
-- NEVER automate in CI.
--
-- Why this exists. The post-Step-4 / pre-reveal email gate captures the
-- merchant's email so we can deliver the assessment report by email,
-- and (separately, optionally) opts them in to ongoing payment-insight
-- emails under the Australian Spam Act 2003. Both fields denormalise
-- onto assessments because there's no other live consumer.
--
-- Idempotent: every column uses ADD COLUMN IF NOT EXISTS so re-runs
-- are safe.

BEGIN;

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS email                text,
  ADD COLUMN IF NOT EXISTS marketing_consent    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_report_sent    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_report_sent_at timestamptz;

COMMENT ON COLUMN assessments.email IS
  'Merchant email collected at the email gate. NULL if merchant skipped.';
COMMENT ON COLUMN assessments.marketing_consent IS
  'Explicit Spam Act 2003 opt-in. Only true when merchant actively ticked the consent checkbox.';
COMMENT ON COLUMN assessments.marketing_consent_at IS
  'Timestamp of consent. NULL when marketing_consent=false.';
COMMENT ON COLUMN assessments.email_report_sent IS
  'True once Resend has accepted the report-delivery request. False on Resend failure or skipped email.';
COMMENT ON COLUMN assessments.email_report_sent_at IS
  'Timestamp of successful Resend send. NULL until sent.';

COMMIT;
