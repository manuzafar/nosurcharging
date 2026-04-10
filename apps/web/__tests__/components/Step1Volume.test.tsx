import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1Volume } from '@/components/assessment/Step1Volume';

describe('Step1Volume', () => {
  const onChange = vi.fn();
  const onNext = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Next button disabled when no volume entered', () => {
    render(
      <Step1Volume value={0} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  it('Next button enabled when volume is provided', () => {
    render(
      <Step1Volume value={500000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeEnabled();
  });

  it('annual/monthly toggle switches displayed value', async () => {
    render(
      <Step1Volume value={0} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );

    // Annual/Monthly toggle is now a radiogroup — query by role=radio
    const monthlyBtn = screen.getByRole('radio', { name: /monthly/i });
    await user.click(monthlyBtn);

    // Type a value after switching to monthly
    const input = screen.getByRole('textbox');
    await user.type(input, '80000');

    // onChange called with annual = monthly * 12
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(80000 * 12);
  });

  it('warning shown when volume < $30,000', () => {
    render(
      <Step1Volume value={20000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    expect(screen.getByText(/under \$30,000/i)).toBeInTheDocument();
  });

  it('no warning when volume >= $30,000', () => {
    render(
      <Step1Volume value={100000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    expect(screen.queryByText(/under \$30,000/i)).not.toBeInTheDocument();
  });

  it('accepts numeric input only (strips non-numeric characters)', async () => {
    render(
      <Step1Volume value={0} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '1abc23');

    // Only numeric chars should pass through: "123"
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(123);
  });

  it('calls onBack when back button is clicked', async () => {
    render(
      <Step1Volume value={100000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );

    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
