-- Migration 009 — assessments.expires_at + check-on-load deletion
-- Ruthless Cut M3 (docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §RETENTION).
--
-- Adds a 30-day TTL to the assessments table.
--
-- Originally scoped as a 48-hour TTL when the PDF artifact was the
-- merchant's persistent record (PDF emailed at submission + on-demand
-- from ArtifactCard). The PDF pipeline was removed in May 2026 when
-- the product shipped as a free MVP — so the TTL was widened to give
-- merchants a comfortable window to revisit their results URL without
-- an external artifact to fall back on. Brand framing shifted from
-- "we don't keep your data, the PDF is your record" to "we don't
-- keep your data for long."
--
-- Deletion mechanism: check-on-load deletion in apps/web/actions/getAssessment.ts.
-- When a stale row is queried we delete it inline and return an
-- "expired" state to the caller. A scheduled cron job (pg_cron OR a
-- Railway scheduled task) is deferred per PB-2 — without one, rows
-- that are never re-queried sit indefinitely. Acceptable for v1.
--
-- IMPORTANT: This migration is APPEND ONLY. The expires_at column has
-- a sane default so existing rows backfill automatically (created_at
-- + 30 days). The email_signups + consents tables are NOT subject to
-- the TTL — they remain unchanged.
--
-- Apply order: staging first (Supabase SQL editor) → verify with the
-- queries at the bottom of this file → production.

-- ── 1. Add the column with the 30-day default ───────────────────

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL
  DEFAULT (NOW() + INTERVAL '30 days');

-- ── 1a. Re-set the default in case the column was previously
-- created with a different interval (e.g. the original 48h default
-- when the migration was first authored). Idempotent.
ALTER TABLE assessments
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '30 days');

-- For rows that already exist (created before this migration, or
-- inserted while the column carried the older 48h default), backfill
-- so the TTL enforcement starts uniformly at 30 days from creation.
UPDATE assessments
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL
   OR expires_at < created_at
   OR expires_at < created_at + INTERVAL '30 days';

-- ── 2. Index for the deletion query ─────────────────────────────
-- The check-on-load path queries `WHERE id = X AND expires_at > NOW()`.
-- We already have a primary key on id, so the additional filter is
-- cheap. A secondary index on expires_at is useful for a future cron
-- sweep ("delete all rows where expires_at < NOW()") without scanning
-- the full table.

CREATE INDEX IF NOT EXISTS idx_assessments_expires_at
  ON assessments (expires_at);

-- ── 3. RLS — no policy change needed ────────────────────────────
-- Anon role still cannot SELECT (USING(false)). Service role bypasses
-- RLS in apps/web/actions/getAssessment.ts. The deletion path runs on
-- the service role.

-- ── Verification queries ────────────────────────────────────────
-- Run these in the SQL editor after applying:
--
-- 1. Column exists with the expected default
--    \d assessments
--    -- Expect:  expires_at | timestamp with time zone | not null default (now() + '30 days'::interval)
--
-- 2. Existing rows backfilled
--    SELECT COUNT(*) FROM assessments WHERE expires_at IS NULL;
--    -- Expect: 0
--
-- 3. Index exists
--    SELECT indexname FROM pg_indexes WHERE tablename = 'assessments';
--    -- Expect a row: idx_assessments_expires_at
--
-- 4. Sample one row to confirm the timing
--    SELECT id, created_at, expires_at, expires_at - created_at AS ttl
--    FROM assessments LIMIT 1;
--    -- Expect: ttl = 30 days
