import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3Surcharging } from '@/components/assessment/Step3Surcharging';

describe('Step3Surcharging', () => {
  const onSurchargingChange = vi.fn();
  const onSurchargeRateChange = vi.fn();
  const onNetworksChange = vi.fn();
  const onNext = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();

  const defaultProps = {
    surcharging: null as boolean | null,
    surchargeRate: 0,
    surchargeNetworks: [] as string[],
    onSurchargingChange,
    onSurchargeRateChange,
    onNetworksChange,
    onNext,
    onBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Yes and No buttons render', () => {
    render(<Step3Surcharging {...defaultProps} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('clicking Yes calls onSurchargingChange(true) and shows network checkboxes', async () => {
    const { rerender } = render(<Step3Surcharging {...defaultProps} />);

    await user.click(screen.getByText('Yes'));
    expect(onSurchargingChange).toHaveBeenCalledWith(true);

    // Rerender as if parent set surcharging=true
    rerender(<Step3Surcharging {...defaultProps} surcharging={true} />);
    expect(screen.getByText(/which networks/i)).toBeInTheDocument();
  });

  it('clicking No hides network checkboxes and resets state', async () => {
    const { rerender } = render(
      <Step3Surcharging {...defaultProps} surcharging={true} />,
    );
    // Network checkboxes visible
    expect(screen.getByText(/which networks/i)).toBeInTheDocument();

    await user.click(screen.getByText('No'));
    expect(onSurchargingChange).toHaveBeenCalledWith(false);
    expect(onSurchargeRateChange).toHaveBeenCalledWith(0);
    expect(onNetworksChange).toHaveBeenCalledWith([]);

    // Rerender as No — Next should be enabled (No doesn't need surcharge rate)
    rerender(<Step3Surcharging {...defaultProps} surcharging={false} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });

  it('Amex carve-out note appears when ONLY Amex checked', () => {
    render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['amex']}
      />,
    );
    expect(
      screen.getByText(/october ban doesn.*cover amex/i),
    ).toBeInTheDocument();
  });

  it('Amex carve-out note disappears when Visa also checked', () => {
    render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['amex', 'visa']}
      />,
    );
    expect(screen.queryByText(/october ban doesn.*cover amex/i)).not.toBeInTheDocument();
  });

  it('carve-out note does NOT appear when only Visa is checked', () => {
    render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['visa']}
      />,
    );
    expect(screen.queryByText(/october ban doesn.*cover amex/i)).not.toBeInTheDocument();
  });

  it('carve-out note appears for BNPL-only too', () => {
    render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['bnpl']}
      />,
    );
    expect(
      screen.getByText(/october ban doesn.*cover amex/i),
    ).toBeInTheDocument();
  });

  it('checkbox toggle calls onNetworksChange', async () => {
    render(
      <Step3Surcharging {...defaultProps} surcharging={true} />,
    );

    const amexCheckbox = screen.getByRole('checkbox', { name: /amex/i });
    await user.click(amexCheckbox);
    expect(onNetworksChange).toHaveBeenCalledWith(['amex']);
  });

  it('Next disabled when Yes selected but no surcharge rate entered', () => {
    render(
      <Step3Surcharging {...defaultProps} surcharging={true} surchargeRate={0} />,
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('Next enabled when No selected', () => {
    render(
      <Step3Surcharging {...defaultProps} surcharging={false} />,
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
  });
});
