-- nosurcharging.com.au — Initial Database Schema
-- Migration: 001_initial.sql
-- Apply to Supabase before writing any application code
-- All connections via PgBouncer pooler: port 6543 (not 5432)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANISATIONS (Phase 3 enterprise multi-tenancy)
-- ============================================================
CREATE TABLE organisations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  country_code   text NOT NULL DEFAULT 'AU',
  tier           text NOT NULL DEFAULT 'individual' CHECK (tier IN ('individual', 'smb', 'enterprise')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ASSESSMENTS
-- Core table. Stores every completed assessment.
-- organisation_id: nullable Phase 1-2, populated Phase 3
-- user_id: nullable Phase 1, populated Phase 2 with Supabase Auth
-- session_id: anonymous identifier, set from HttpOnly cookie
-- country_code: AU for Phase 1, other codes in Phase 2+
-- inputs: typed AssessmentInputs object (see packages/calculations/types.ts)
-- outputs: typed AssessmentOutputs object
-- ip_hash: HMAC-SHA256(ip, IP_HASH_SECRET) — never raw IP
-- ============================================================
CREATE TABLE assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid REFERENCES organisations(id),
  user_id          uuid, -- References auth.users in Phase 2
  session_id       uuid NOT NULL,
  country_code     text NOT NULL DEFAULT 'AU',
  category         integer NOT NULL CHECK (category IN (1, 2, 3, 4)),
  inputs           jsonb NOT NULL,
  outputs          jsonb NOT NULL,
  ip_hash          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assessments_session_id_idx ON assessments(session_id);
CREATE INDEX assessments_country_code_idx ON assessments(country_code);
CREATE INDEX assessments_created_at_idx ON assessments(created_at);

-- ============================================================
-- CONSENTS
-- APPEND-ONLY. RLS denies UPDATE and DELETE at database level.
-- Records every consent acknowledgement with exact text shown.
-- consent_type: 'disclaimer' | 'email_marketing' | 'data_collection'
-- consent_version: e.g. 'v1.0' — increment when text changes
-- consent_text: the exact wording shown to the user at time of consent
-- ip_hash: HMAC-SHA256(ip, IP_HASH_SECRET)
-- ============================================================
CREATE TABLE consents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid REFERENCES organisations(id),
  user_id          uuid, -- References auth.users in Phase 2
  session_id       uuid NOT NULL,
  consent_type     text NOT NULL CHECK (consent_type IN ('disclaimer', 'email_marketing', 'data_collection')),
  consent_text     text NOT NULL, -- Exact wording displayed
  consent_version  text NOT NULL, -- Increment when text changes
  consented        boolean NOT NULL,
  ip_hash          text,
  user_agent       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consents_session_id_idx ON consents(session_id);

-- ============================================================
-- EMAIL SIGNUPS
-- email_encrypted: pgp_sym_encrypt(email, app.encryption_key)
-- Decrypted only when sending the October benchmarking email
-- signup_source: 'assessment_complete' | 'benchmarking_waitlist'
-- ============================================================
CREATE TABLE email_signups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid REFERENCES organisations(id),
  user_id          uuid, -- References auth.users in Phase 2
  email_encrypted  text NOT NULL, -- pgp_sym_encrypt at rest
  country_code     text NOT NULL DEFAULT 'AU',
  signup_source    text,
  assessment_id    uuid REFERENCES assessments(id),
  consent_id       uuid REFERENCES consents(id),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_signups_country_code_idx ON email_signups(country_code);

-- ============================================================
-- INVOICE UPLOADS (Phase 2)
-- Files are never stored beyond processing.
-- Supabase Storage lifecycle policy deletes after 24 hours.
-- extraction_confidence: 'high' | 'medium' | 'low' | 'failed'
-- status: 'pending' | 'processing' | 'complete' | 'failed' | 'needs_review'
-- ============================================================
CREATE TABLE invoice_uploads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id        uuid REFERENCES organisations(id),
  user_id                uuid NOT NULL, -- Auth required for Phase 2
  country_code           text NOT NULL DEFAULT 'AU',
  psp_detected           text,
  extraction_result      jsonb,
  extraction_confidence  text CHECK (extraction_confidence IN ('high', 'medium', 'low', 'failed')),
  status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'needs_review')),
  processed_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RATE LIMITING (Phase 1 — no Redis needed)
-- Used by the rate limit middleware to track request counts.
-- Keyed by: ip_hash + endpoint + window (hourly or daily)
-- ============================================================
CREATE TABLE rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL, -- HMAC-SHA256(ip) + ':' + endpoint + ':' + window
  count       integer NOT NULL DEFAULT 1,
  window_end  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(key)
);

CREATE INDEX rate_limits_key_idx ON rate_limits(key);
CREATE INDEX rate_limits_window_end_idx ON rate_limits(window_end);

-- ============================================================
-- PSP RATE REGISTRY (Phase 1 or 2 — decision pending OQ-05)
-- Crowdsourced merchant rate submissions.
-- trust_score: computed on insert based on validation rules
-- quarantined: low trust score, excluded from benchmarking
-- ============================================================
CREATE TABLE psp_rate_registry (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id      uuid REFERENCES assessments(id), -- Validates submission has real assessment
  psp_name           text NOT NULL,
  plan_type          text NOT NULL CHECK (plan_type IN ('flat', 'costplus')),
  country_code       text NOT NULL DEFAULT 'AU',
  volume_band        text NOT NULL CHECK (volume_band IN ('0-100k', '100k-1m', '1m-10m', '10m-50m', '50m+')),
  effective_rate_pct decimal(8, 4),
  debit_cents        decimal(8, 4),
  credit_pct         decimal(8, 4),
  trust_score        integer NOT NULL DEFAULT 0,
  quarantined        boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BUSINESS RULES (Phase 3 enterprise only)
-- ============================================================
CREATE TABLE business_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES organisations(id),
  country_code     text NOT NULL,
  rule_type        text NOT NULL,
  rule_config      jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CONSULTING LEADS
-- Populated via Calendly webhook when a discovery call is booked.
-- ============================================================
CREATE TABLE consulting_leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  business_name   text,
  email_encrypted text, -- pgp_sym_encrypt at rest
  country_code    text NOT NULL DEFAULT 'AU',
  event_time      timestamptz,
  assessment_id   uuid REFERENCES assessments(id),
  source          text DEFAULT 'calendly',
  status          text DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'converted', 'lost')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on all tables before any application code runs.
-- ============================================================

ALTER TABLE organisations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_signups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE psp_rate_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_rules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulting_leads  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ASSESSMENTS RLS POLICIES
-- Phase 1: session-scoped inserts, no public reads
-- Phase 2: user_id-scoped reads added when auth is live
-- ============================================================
CREATE POLICY "assessments_insert_own"
  ON assessments FOR INSERT
  WITH CHECK (true); -- Server action validates session_id before insert

CREATE POLICY "assessments_no_public_read"
  ON assessments FOR SELECT
  USING (false); -- No public reads in Phase 1

-- ============================================================
-- CONSENTS RLS POLICIES
-- APPEND-ONLY enforced at database level.
-- UPDATE and DELETE are explicitly denied — not just omitted.
-- ============================================================
CREATE POLICY "consents_insert_only"
  ON consents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "consents_deny_update"
  ON consents FOR UPDATE
  USING (false); -- Explicit DENY — do not remove

CREATE POLICY "consents_deny_delete"
  ON consents FOR DELETE
  USING (false); -- Explicit DENY — do not remove

CREATE POLICY "consents_no_public_read"
  ON consents FOR SELECT
  USING (false);

-- ============================================================
-- EMAIL SIGNUPS RLS POLICIES
-- ============================================================
CREATE POLICY "email_signups_insert"
  ON email_signups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "email_signups_no_public_read"
  ON email_signups FOR SELECT
  USING (false);

-- ============================================================
-- RATE LIMITS RLS POLICIES
-- Server actions use service role key, which bypasses RLS.
-- These policies block any direct client access.
-- ============================================================
CREATE POLICY "rate_limits_no_direct_access"
  ON rate_limits FOR ALL
  USING (false);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Clean up expired rate limit windows (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_end < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upsert rate limit (increment or create)
CREATE OR REPLACE FUNCTION upsert_rate_limit(
  p_key text,
  p_window_end timestamptz
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO rate_limits (key, count, window_end)
  VALUES (p_key, 1, p_window_end)
  ON CONFLICT (key) DO UPDATE
    SET count = rate_limits.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PHASE 2: Auth integration notes
-- When Supabase Auth is added, add these policies:
--
-- ALTER POLICY "assessments_no_public_read" ON assessments
--   USING (user_id = auth.uid() OR session_id = current_setting('app.session_id')::uuid);
--
-- UPDATE assessments SET user_id = auth.uid()
--   WHERE session_id = [claimed session id];
-- ============================================================
