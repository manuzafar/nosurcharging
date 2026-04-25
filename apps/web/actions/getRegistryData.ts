'use server';

import { supabaseAdmin } from '@/lib/supabase/server';

export interface BenchmarkRow {
  psp_name: string;
  plan_type: string;
  volume_band: string;
  entry_count: number;
  median_rate: number;
  min_rate: number;
  max_rate: number;
}

export async function getRegistryCount(): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_registry_count');
    if (error || data == null) return null;
    return data as number;
  } catch {
    return null;
  }
}

export async function getRegistryBenchmarks(
  pspName: string,
  planType: string,
): Promise<BenchmarkRow[] | null> {
  try {
    const { data, error } = await supabaseAdmin.rpc('get_registry_benchmarks', {
      p_psp_name: pspName,
      p_plan_type: planType,
    });
    if (error || !data) return null;
    return data as BenchmarkRow[];
  } catch {
    return null;
  }
}
