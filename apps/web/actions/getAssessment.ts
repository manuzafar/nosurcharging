'use server';

// Fetches assessment results by ID.
// Used by the results page to load data from a URL search param.
// Service role bypasses RLS (assessments table has SELECT USING(false) for anon).

import { supabaseAdmin } from '@/lib/supabase/server';
import type { AssessmentOutputs, ActionItem } from '@nosurcharging/calculations/types';

export interface StoredAssessment {
  id: string;
  category: number;
  // variant_type retained for back-compat queries on legacy zero_cost rows.
  // Post-migration-007, category alone is authoritative for routing.
  variant_type: 'standard' | 'zero_cost' | 'strategic_rate';
  inputs: Record<string, unknown>;
  outputs: AssessmentOutputs & { actions?: ActionItem[] };
  created_at: string;
}

export async function getAssessment(
  assessmentId: string,
): Promise<{ success: boolean; data?: StoredAssessment; error?: string }> {
  if (!assessmentId || !/^[0-9a-f-]{36}$/.test(assessmentId)) {
    return { success: false, error: 'Invalid assessment ID' };
  }

  const { data, error } = await supabaseAdmin
    .from('assessments')
    .select('id, category, variant_type, inputs, outputs, created_at')
    .eq('id', assessmentId)
    .single();

  if (error || !data) {
    return { success: false, error: 'Assessment not found' };
  }

  return {
    success: true,
    data: data as StoredAssessment,
  };
}
