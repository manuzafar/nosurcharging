-- Migration 006: PSP registry additional fields + RPC functions
-- Adds industry and state_code columns for segment benchmarking.
-- Creates two SECURITY DEFINER RPC functions (no RLS policy changes needed).

ALTER TABLE psp_rate_registry
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS state_code text;

-- RPC: Count of non-quarantined entries (SECURITY DEFINER — no RLS policy needed)
CREATE OR REPLACE FUNCTION get_registry_count()
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM psp_rate_registry WHERE quarantined = false;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RPC: Aggregated benchmarks per segment (only segments with >= 5 entries)
CREATE OR REPLACE FUNCTION get_registry_benchmarks(
  p_psp_name text DEFAULT NULL,
  p_plan_type text DEFAULT NULL
)
RETURNS TABLE (
  psp_name text, plan_type text, volume_band text,
  entry_count integer, median_rate numeric, min_rate numeric, max_rate numeric
) AS $$
  SELECT r.psp_name, r.plan_type, r.volume_band,
    COUNT(*)::integer,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.effective_rate_pct),
    MIN(r.effective_rate_pct), MAX(r.effective_rate_pct)
  FROM psp_rate_registry r
  WHERE r.quarantined = false
    AND (p_psp_name IS NULL OR r.psp_name = p_psp_name)
    AND (p_plan_type IS NULL OR r.plan_type = p_plan_type)
  GROUP BY r.psp_name, r.plan_type, r.volume_band
  HAVING COUNT(*) >= 5;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
