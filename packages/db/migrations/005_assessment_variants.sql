-- Migration 005: Support zero-cost and strategic-rate assessment variants
-- Apply via Supabase SQL editor: staging FIRST → verify → production
-- NEVER automate in CI

ALTER TABLE assessments
  DROP CONSTRAINT IF EXISTS assessments_category_check;

ALTER TABLE assessments
  ADD CONSTRAINT assessments_category_check
  CHECK (category IN (0, 1, 2, 3, 4, 5));
-- 0 = zero_cost, 5 = strategic_rate, 1-4 = existing categories

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS variant_type text
  CHECK (variant_type IN ('standard', 'zero_cost', 'strategic_rate'));

UPDATE assessments SET variant_type = 'standard' WHERE variant_type IS NULL;

-- NOT NULL must be set AFTER the UPDATE — existing rows would otherwise fail
ALTER TABLE assessments ALTER COLUMN variant_type SET NOT NULL;
