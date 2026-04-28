-- Migration 007: Promote zero-cost from sentinel category=0 to first-class
-- category=5. Renumbers strategic_rate from 5 to 6 to free up the slot.
--
-- Apply via Supabase SQL editor: staging FIRST → verify → production
-- NEVER automate in CI
--
-- Why this exists. Migration 005 introduced two parallel pipelines:
--   - zero_cost   stored at category=0 (sentinel) with ZeroCostOutputs shape
--   - strategic_rate stored at category=5 (sentinel) with no outputs
-- Architecture refactor (Cat 5 first-class) requires zero_cost rows to live
-- at category=5 with the standard AssessmentOutputs shape. This migration
-- relocates strategic_rate to 6, moves zero_cost to 5, and rewrites legacy
-- ZeroCostOutputs JSON so application code reading these rows after the
-- refactor doesn't crash on shape mismatch.

BEGIN;

-- Step 1 — widen constraint to accommodate transition
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_category_check;
ALTER TABLE assessments
  ADD CONSTRAINT assessments_category_check
  CHECK (category IN (0, 1, 2, 3, 4, 5, 6));

-- Step 2 — backfill strategic_rate from 5 → 6 (must run BEFORE step 3
-- to free up category=5 for zero_cost)
UPDATE assessments
   SET category = 6
 WHERE category = 5
   AND variant_type = 'strategic_rate';

-- Step 3 — backfill zero_cost from 0 → 5
UPDATE assessments
   SET category = 5
 WHERE category = 0
   AND variant_type = 'zero_cost';

-- Step 4 — rewrite legacy ZeroCostOutputs JSON to AssessmentOutputs shape.
-- Old shape:
--   { modelType: 'zero_cost', preReformNetCost: 0, postReformNetCost: X,
--     reformImpact: X, plSwing: +X, plSwingLow: +V×0.012, plSwingHigh: +V×0.016,
--     estimatedMSFRate, confidence: 'directional', urgency, period, actions, ... }
-- New shape (AssessmentOutputs):
--   { category: 5, netToday: 0, octNet: X, plSwing: -X,
--     plSwingLow: -V×0.016, plSwingHigh: -V×0.012,
--     rangeDriver: 'post_reform_rate', rangeNote, estimatedMSFRate,
--     debitSaving, creditSaving, icSaving, todayInterchange, todayMargin,
--     grossCOA, annualMSF, surchargeRevenue, todayScheme, oct2026Scheme,
--     confidence, period, actions }
--
-- Sign convention. Old plSwing was +X (cost magnitude). New plSwing is -X
-- (P&L impact, negative because the merchant is losing money). Range bounds
-- swap: old plSwingLow was the smaller positive (best case); new plSwingLow
-- is the more negative (worst case).
--
-- Backfill caveat. Legacy rows lack debit/credit/scheme/grossCOA fields.
-- They are populated as 0 — display-safe (AssumptionsPanel hides $0 rows).
-- Confidence demoted from 'directional' (zero-cost-only literal) to 'low'
-- since AssessmentOutputs.Confidence is 'high' | 'medium' | 'low'.
UPDATE assessments
   SET outputs = jsonb_strip_nulls(
     jsonb_build_object(
       'category', 5,
       'netToday', 0,
       'octNet', COALESCE((outputs->>'postReformNetCost')::numeric, 0),
       'plSwing', -1 * COALESCE((outputs->>'plSwing')::numeric, 0),
       -- Bounds swap: new plSwingLow is the more negative (was old plSwingHigh)
       'plSwingLow',  -1 * COALESCE((outputs->>'plSwingHigh')::numeric, 0),
       'plSwingHigh', -1 * COALESCE((outputs->>'plSwingLow')::numeric, 0),
       'rangeDriver', 'post_reform_rate',
       'rangeNote', COALESCE(
         outputs->>'rangeNote',
         'Range shows 1.2%-1.6% post-reform rate scenarios. Centre uses 1.4% market benchmark.'
       ),
       'estimatedMSFRate', (outputs->>'estimatedMSFRate')::numeric,
       'icSaving', 0,
       'debitSaving', 0,
       'creditSaving', 0,
       'todayInterchange', 0,
       'todayMargin', 0,
       'grossCOA', 0,
       'annualMSF', 0,
       'surchargeRevenue', 0,
       'todayScheme', 0,
       'oct2026Scheme', 0,
       'confidence', 'low',
       'period', outputs->>'period',
       'actions', outputs->'actions'
     )
   )
 WHERE category = 5
   AND variant_type = 'zero_cost'
   AND outputs ? 'modelType';

-- Step 5 — tighten constraint to drop the 0 sentinel
ALTER TABLE assessments DROP CONSTRAINT assessments_category_check;
ALTER TABLE assessments
  ADD CONSTRAINT assessments_category_check
  CHECK (category IN (1, 2, 3, 4, 5, 6));

-- Step 6 — refresh column comment
COMMENT ON COLUMN assessments.category IS
  '1=costplus_no_surcharge, 2=flat_no_surcharge, 3=costplus_surcharging, 4=flat_surcharging, 5=zero_cost, 6=strategic_rate';

COMMIT;
