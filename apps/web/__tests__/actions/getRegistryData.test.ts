import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    rpc: mockRpc,
  },
}));

import { getRegistryCount, getRegistryBenchmarks } from '@/actions/getRegistryData';

describe('getRegistryCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns number on success', async () => {
    mockRpc.mockResolvedValue({ data: 42, error: null });
    const result = await getRegistryCount();
    expect(result).toBe(42);
    expect(mockRpc).toHaveBeenCalledWith('get_registry_count');
  });

  it('returns null on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const result = await getRegistryCount();
    expect(result).toBeNull();
  });

  it('returns null when RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('network'));
    const result = await getRegistryCount();
    expect(result).toBeNull();
  });
});

describe('getRegistryBenchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns array on success', async () => {
    const rows = [
      { psp_name: 'Stripe', plan_type: 'flat', volume_band: '100k-1m', entry_count: 7, median_rate: 0.014, min_rate: 0.012, max_rate: 0.018 },
    ];
    mockRpc.mockResolvedValue({ data: rows, error: null });

    const result = await getRegistryBenchmarks('Stripe', 'flat');
    expect(result).toEqual(rows);
    expect(mockRpc).toHaveBeenCalledWith('get_registry_benchmarks', {
      p_psp_name: 'Stripe',
      p_plan_type: 'flat',
    });
  });

  it('returns null on error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const result = await getRegistryBenchmarks('Stripe', 'flat');
    expect(result).toBeNull();
  });

  it('returns null when RPC throws', async () => {
    mockRpc.mockRejectedValue(new Error('network'));
    const result = await getRegistryBenchmarks('Stripe', 'flat');
    expect(result).toBeNull();
  });
});
