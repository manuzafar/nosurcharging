import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockGetRegistryCount, mockGetRegistryBenchmarks } = vi.hoisted(() => ({
  mockGetRegistryCount: vi.fn(),
  mockGetRegistryBenchmarks: vi.fn(),
}));

vi.mock('@/actions/getRegistryData', () => ({
  getRegistryCount: mockGetRegistryCount,
  getRegistryBenchmarks: mockGetRegistryBenchmarks,
}));

vi.mock('@/actions/contributeRate', () => ({
  contributeRate: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  Analytics: {
    registryFormStarted: vi.fn(),
    registryContributed: vi.fn(),
  },
  getVolumeTier: vi.fn(() => '500k-1m'),
}));

import { PSPRegistrySection } from '@/components/results/sections/PSPRegistrySection';

const defaultProps = {
  assessmentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  pspName: 'Stripe',
  planType: 'flat' as const,
  volume: 500_000,
  category: 2 as const,
  industry: 'retail',
};

describe('PSPRegistrySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRegistryCount.mockResolvedValue(42);
    mockGetRegistryBenchmarks.mockResolvedValue([]);
  });

  it('renders section with correct id and data-section', () => {
    const { container } = render(<PSPRegistrySection {...defaultProps} />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('registry');
    expect(section?.getAttribute('data-section')).toBe('registry');
  });

  it('shows "Building..." when count is null', () => {
    mockGetRegistryCount.mockResolvedValue(null);
    render(<PSPRegistrySection {...defaultProps} />);
    // Initially before fetch resolves, count is null
    expect(screen.getByText('Building...')).toBeInTheDocument();
  });

  it('shows count when fetched', async () => {
    mockGetRegistryCount.mockResolvedValue(42);
    render(<PSPRegistrySection {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    expect(screen.getByText('rates contributed')).toBeInTheDocument();
  });

  it('renders 3 tabs', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    expect(screen.getByText('Contribute your rate')).toBeInTheDocument();
    expect(screen.getByText('See the benchmark')).toBeInTheDocument();
    expect(screen.getByText('How it works')).toBeInTheDocument();
  });

  it('switches tabs on click', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    fireEvent.click(screen.getByText('How it works'));
    expect(screen.getByText('What we collect')).toBeInTheDocument();
    expect(screen.getByText('What we never collect')).toBeInTheDocument();
  });

  it('shows "Not enough data yet" on empty benchmarks', async () => {
    mockGetRegistryBenchmarks.mockResolvedValue([]);
    render(<PSPRegistrySection {...defaultProps} />);

    fireEvent.click(screen.getByText('See the benchmark'));

    await waitFor(() => {
      expect(screen.getByText('Not enough data yet')).toBeInTheDocument();
    });
  });

  it('form renders in contribute tab', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    // PSPRateRegistry form should show PSP name in readonly field
    expect(screen.getByDisplayValue('Stripe')).toBeInTheDocument();
  });

  it('renders hero title', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    expect(
      screen.getByText('Help build the only independent Australian merchant rate database'),
    ).toBeInTheDocument();
  });

  it('renders value exchange columns', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    expect(screen.getByText('You contribute')).toBeInTheDocument();
    expect(screen.getByText('You get back')).toBeInTheDocument();
    expect(screen.getByText('On 30 October')).toBeInTheDocument();
  });

  it('renders eyebrow label', () => {
    render(<PSPRegistrySection {...defaultProps} />);
    expect(screen.getByText('Community')).toBeInTheDocument();
  });
});
