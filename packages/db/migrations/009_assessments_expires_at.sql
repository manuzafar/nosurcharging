-- Migration 009 — assessments.expires_at + check-on-load deletion
-- Ruthless Cut M3 (docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §RETENTION).
--
-- Adds a 48-hour TTL to the assessments table. The brand promise is
-- "we don't keep your data" — the PDF artifact (sent at submission +
-- on-demand from ArtifactCard) is the merchant's persistent record.
--
-- Deletion mechanism: check-on-load deletion in apps/web/actions/getAssessment.ts.
-- When a stale row is queried we delete it inline and return an
-- "expired" state to the caller. A scheduled cron job (pg_cron OR a
-- Railway scheduled task) is deferred per PB-2 — without one, rows
-- that are never re-queried sit indefinitely. Acceptable for v1
-- because the PDF email send happens at submission, before the row
-- expires; merchants reloading after 48h hit the deletion path.
--
-- IMPORTANT: This migration is APPEND ONLY. The expires_at column has
-- a sane default so existing rows backfill automatically (created_at
-- + 48 hours). The email_signups + consents tables are NOT subject to
-- the TTL — they remain unchanged.
--
-- Apply order: staging first (Supabase SQL editor) → verify with the
-- queries at the bottom of this file → production.

-- ── 1. Add the column with the 48-hour default ──────────────────

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL
  DEFAULT (NOW() + INTERVAL '48 hours');

-- For rows that already exist (created before this migration), the
-- DEFAULT only fires for new INSERTs. Backfill explicitly so the TTL
-- enforcement starts immediately.
UPDATE assessments
SET expires_at = created_at + INTERVAL '48 hours'
WHERE expires_at IS NULL OR expires_at < created_at;

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
--    -- Expect:  expires_at | timestamp with time zone | not null default (now() + '48:00:00'::interval)
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
--    -- Expect: ttl = 48:00:00
