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
    planType: null as 'flat' | 'costplus' | null,
    psp: null as string | null,
    merchantInput: {},
    onPlanTypeChange,
    onPspChange,
    onMerchantInputChange,
    onNext,
    onBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('both plan type cards render', () => {
    render(<Step2PlanType {...defaultProps} />);
    expect(screen.getByRole('radio', { name: /flat rate/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /cost-plus/i })).toBeInTheDocument();
  });

  it('clicking flat rate card selects it (aria-checked=true)', async () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} />);
    const flatCard = screen.getByRole('radio', { name: /flat rate/i });

    await user.click(flatCard);
    expect(onPlanTypeChange).toHaveBeenCalledWith('flat');

    // Rerender with flat selected to verify aria-checked
    rerender(<Step2PlanType {...defaultProps} planType="flat" />);
    expect(screen.getByRole('radio', { name: /flat rate/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /cost-plus/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('clicking cost-plus deselects flat and selects cost-plus', async () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} planType="flat" />);

    await user.click(screen.getByRole('radio', { name: /cost-plus/i }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('costplus');

    rerender(<Step2PlanType {...defaultProps} planType="costplus" />);
    expect(screen.getByRole('radio', { name: /cost-plus/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /flat rate/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('expert toggle hidden by default, shown when clicked', async () => {
    render(<Step2PlanType {...defaultProps} />);
    // Expert toggle link is visible
    const toggle = screen.getByRole('button', { name: /payment wizard/i });
    expect(toggle).toBeInTheDocument();

    // Expert panel fields are not initially accessible
    // (they're inside a collapsed overflow-hidden container)
    expect(screen.queryByText(/use smart defaults/i)).not.toBeInTheDocument();

    // Click expands it
    await user.click(toggle);
    expect(screen.getByText(/use smart defaults/i)).toBeInTheDocument();
  });

  it('PSP pill selection works', async () => {
    render(<Step2PlanType {...defaultProps} />);

    const stripePill = screen.getByRole('button', { name: 'Stripe' });
    await user.click(stripePill);
    expect(onPspChange).toHaveBeenCalledWith('Stripe');
  });

  it('all 9 PSP options render', () => {
    render(<Step2PlanType {...defaultProps} />);
    const psps = ['Stripe', 'Square', 'Tyro', 'CommBank', 'ANZ', 'Westpac', 'eWAY', 'Adyen', 'Other'];
    for (const psp of psps) {
      expect(screen.getByRole('button', { name: psp })).toBeInTheDocument();
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

  it('mock statement content renders correctly', () => {
    render(<Step2PlanType {...defaultProps} />);
    // Flat rate card content
    expect(screen.getByText(/merchant service fee/i)).toBeInTheDocument();
    expect(screen.getByText('1.40%')).toBeInTheDocument();
    // Cost-plus card content
    expect(screen.getByText(/debit interchange/i)).toBeInTheDocument();
    expect(screen.getByText('PSP margin')).toBeInTheDocument();
  });
});
