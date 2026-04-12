import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2PlanType } from '@/components/assessment/Step2PlanType';

describe('Step2PlanType', () => {
  const onPlanTypeChange = vi.fn();
  const onPspChange = vi.fn();
  const onMerchantInputChange = vi.fn();
  const onNext = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();

  const defaultProps = {
    planType: null as 'flat' | 'costplus' | 'blended' | 'zero_cost' | null,
    msfRateMode: 'unselected' as 'unselected' | 'market_estimate' | 'custom',
    customMSFRate: null as number | null,
    blendedDebitRate: null as number | null,
    blendedCreditRate: null as number | null,
    psp: null as string | null,
    merchantInput: {},
    onPlanTypeChange,
    onMsfRateModeChange: vi.fn(),
    onCustomMSFRateChange: vi.fn(),
    onBlendedRatesChange: vi.fn(),
    onStrategicRateSelected: vi.fn(),
    onPspChange,
    onMerchantInputChange,
    onNext,
    onBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('both plan type tiles render', () => {
    render(<Step2PlanType {...defaultProps} />);
    expect(screen.getByRole('radio', { name: /one percentage on every transaction/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /list of separate charges/i })).toBeInTheDocument();
  });

  it('clicking flat rate tile selects it (aria-checked=true)', async () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} />);
    const flatTile = screen.getByRole('radio', { name: /one percentage on every transaction/i });

    await user.click(flatTile);
    expect(onPlanTypeChange).toHaveBeenCalledWith('flat');

    // Rerender with flat selected to verify aria-checked
    rerender(<Step2PlanType {...defaultProps} planType="flat" />);
    expect(screen.getByRole('radio', { name: /one percentage on every transaction/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /list of separate charges/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('clicking cost-plus deselects flat and selects cost-plus', async () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} planType="flat" />);

    await user.click(screen.getByRole('radio', { name: /list of separate charges/i }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('costplus');

    rerender(<Step2PlanType {...defaultProps} planType="costplus" />);
    expect(screen.getByRole('radio', { name: /list of separate charges/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /one percentage on every transaction/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('expert toggle hidden by default, shown when clicked', async () => {
    render(<Step2PlanType {...defaultProps} />);
    // Expert toggle link is visible
    const toggle = screen.getByRole('button', { name: /payment wizard/i });
    expect(toggle).toBeInTheDocument();

    // Expert panel is collapsed — toggle shows "Enter your exact rates"
    expect(screen.queryByText(/use smart defaults instead/i)).not.toBeInTheDocument();

    // Click expands it — button text changes to "Use smart defaults instead"
    await user.click(toggle);
    expect(screen.getByText(/use smart defaults instead/i)).toBeInTheDocument();
  });

  it('PSP pill selection works', async () => {
    render(<Step2PlanType {...defaultProps} />);

    // PSP pills are a radiogroup — query by role=radio
    const stripePill = screen.getByRole('radio', { name: 'Stripe' });
    await user.click(stripePill);
    expect(onPspChange).toHaveBeenCalledWith('Stripe');
  });

  it('all 9 PSP options render', () => {
    render(<Step2PlanType {...defaultProps} />);
    const psps = ['Stripe', 'Square', 'Tyro', 'CommBank', 'ANZ', 'Westpac', 'eWAY', 'Adyen', 'Other'];
    for (const psp of psps) {
      expect(screen.getByRole('radio', { name: psp })).toBeInTheDocument();
    }
  });

  it('Next button disabled until BOTH plan type AND PSP selected', async () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} />);

    // Neither selected
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    // Only plan type
    rerender(<Step2PlanType {...defaultProps} planType="flat" />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    // Only PSP
    rerender(<Step2PlanType {...defaultProps} psp="Stripe" />);
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    // Both selected
    rerender(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  it('mock bill content uses structure bars (no rate figures)', () => {
    render(<Step2PlanType {...defaultProps} />);
    // Flat rate tile — structure labels, no percentages
    expect(screen.getByText(/merchant service fee/i)).toBeInTheDocument();
    expect(screen.getAllByText(/total charged/i).length).toBeGreaterThanOrEqual(1);
    // Cost-plus tile — structure labels
    expect(screen.getByText(/payment processing costs/i)).toBeInTheDocument();
    expect(screen.getByText(/provider margin/i)).toBeInTheDocument();
    // No specific rate figures anywhere
    const allText = document.body.textContent ?? '';
    expect(allText).not.toContain('1.40%');
    expect(allText).not.toContain('$1,400');
    expect(allText).not.toContain('$312');
    expect(allText).not.toContain('$280');
    expect(allText).not.toContain('$88');
    expect(allText).not.toContain('$95');
  });
});
