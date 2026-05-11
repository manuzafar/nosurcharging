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

  it('clicking Yes from null prefills all networks and 2% rate', async () => {
    // First click on Yes from initial state should pre-select all four
    // designated/exempt networks and set the rate to the AU-typical 2%.
    render(<Step3Surcharging {...defaultProps} />);
    await user.click(screen.getByText('Yes'));
    expect(onNetworksChange).toHaveBeenCalledWith(['visa', 'eftpos', 'amex', 'bnpl']);
    expect(onSurchargeRateChange).toHaveBeenCalledWith(0.02);
    expect(onSurchargingChange).toHaveBeenCalledWith(true);
  });

  it('does not overwrite existing networks/rate when re-clicking Yes', async () => {
    // If the merchant goes back-and-forth and Yes is already selected with
    // their custom values, re-clicking Yes must NOT clobber them.
    render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['visa']}
        surchargeRate={0.015}
      />,
    );
    await user.click(screen.getByText('Yes'));
    expect(onNetworksChange).not.toHaveBeenCalled();
    expect(onSurchargeRateChange).not.toHaveBeenCalled();
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

  it('regulatory info note appears whenever Yes is selected (any network mix)', () => {
    // Per the Step 3 brief, the always-on info note replaces the previous
    // conditional Amex-only carve-out note. It surfaces the reform context
    // regardless of which networks the merchant has checked.
    const { rerender } = render(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['amex']}
      />,
    );
    expect(
      screen.getByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).toBeInTheDocument();

    // Same note with Visa also checked
    rerender(
      <Step3Surcharging
        {...defaultProps}
        surcharging={true}
        surchargeNetworks={['amex', 'visa']}
      />,
    );
    expect(
      screen.getByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).toBeInTheDocument();
  });

  it('regulatory note hidden when No is selected', () => {
    render(<Step3Surcharging {...defaultProps} surcharging={false} />);
    expect(
      screen.queryByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).not.toBeInTheDocument();
  });

  it('rate quick-pick chip click sets the rate value', async () => {
    render(<Step3Surcharging {...defaultProps} surcharging={true} surchargeRate={0.02} />);
    // Chip 1.5% click
    await user.click(screen.getByRole('button', { name: '1.5%' }));
    expect(onSurchargeRateChange).toHaveBeenCalledWith(0.015);
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

  describe('mode="zero_cost" — Cat 5 simplified Amex-only question', () => {
    it('renders the simplified zero-cost heading and Amex question', () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surchargeNetworks={['visa', 'mastercard', 'eftpos']}
        />,
      );
      expect(screen.getByText(/one last question about amex/i)).toBeInTheDocument();
      expect(screen.getByText(/separately surcharge amex/i)).toBeInTheDocument();
    });

    it('does NOT show PayPal/BNPL/Visa+Mastercard checkbox options', () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surchargeNetworks={['visa', 'mastercard', 'eftpos']}
        />,
      );
      // No standard "Which networks do you surcharge?" multi-select
      expect(screen.queryByText(/which networks do you surcharge/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/bnpl/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/paypal/i)).not.toBeInTheDocument();
      // No standalone Visa & Mastercard checkbox option
      expect(screen.queryByRole('checkbox', { name: /visa.*mastercard/i })).not.toBeInTheDocument();
    });

    it('clicking Yes appends "amex" to surchargeNetworks (preserving designated three)', async () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surchargeNetworks={['visa', 'mastercard', 'eftpos']}
        />,
      );
      await user.click(screen.getByText('Yes'));
      expect(onSurchargingChange).toHaveBeenCalledWith(true);
      expect(onNetworksChange).toHaveBeenCalledWith(['visa', 'mastercard', 'eftpos', 'amex']);
    });

    it('clicking No removes "amex" and zeroes the rate', async () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surcharging={true}
          surchargeRate={0.015}
          surchargeNetworks={['visa', 'mastercard', 'eftpos', 'amex']}
        />,
      );
      await user.click(screen.getByText('No'));
      expect(onSurchargingChange).toHaveBeenCalledWith(false);
      expect(onSurchargeRateChange).toHaveBeenCalledWith(0);
      expect(onNetworksChange).toHaveBeenCalledWith(['visa', 'mastercard', 'eftpos']);
    });

    it('Next disabled when Yes selected but no Amex rate entered', () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surcharging={true}
          surchargeRate={0}
          surchargeNetworks={['visa', 'mastercard', 'eftpos', 'amex']}
        />,
      );
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('Next enabled when No selected', () => {
      render(
        <Step3Surcharging
          {...defaultProps}
          mode="zero_cost"
          surcharging={false}
          surchargeNetworks={['visa', 'mastercard', 'eftpos']}
        />,
      );
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    });
  });
});
