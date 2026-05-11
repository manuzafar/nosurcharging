import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1Volume } from '@/components/assessment/Step1Volume';

// Stateful harness — the inline input is a controlled component, so
// the test wrapper has to actually update `value` for typing to stick.
// Tests can subscribe to onChange via the `onChangeSpy` callback to
// assert the last value the component requested.
function Harness({
  initial = 0,
  onChangeSpy,
}: {
  initial?: number;
  onChangeSpy?: (v: number) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Step1Volume
      value={value}
      onChange={(v) => {
        setValue(v);
        onChangeSpy?.(v);
      }}
      onNext={() => {}}
      onBack={() => {}}
    />
  );
}

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

  it('renders the big mono value display by default (not an input)', () => {
    render(
      <Step1Volume value={500000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    // Display state — value renders inside a <button> for click-to-edit.
    expect(
      screen.getByRole('button', { name: /edit annual card turnover/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    // Input only appears after clicking the display.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('clicking the display swaps to an editable input', async () => {
    render(
      <Step1Volume value={500000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    await user.click(
      screen.getByRole('button', { name: /edit annual card turnover/i }),
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('typing into the inline input updates the volume (numeric only)', async () => {
    const spy = vi.fn();
    render(<Harness onChangeSpy={spy} />);
    await user.click(
      screen.getByRole('button', { name: /edit annual card turnover/i }),
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '1abc23');
    // Only numeric chars pass through: "123"
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(123);
  });

  it('annual/monthly toggle stores annual internally (monthly × 12)', async () => {
    const spy = vi.fn();
    render(<Harness onChangeSpy={spy} />);
    const monthlyBtn = screen.getByRole('radio', { name: /monthly/i });
    await user.click(monthlyBtn);
    await user.click(
      screen.getByRole('button', { name: /edit monthly card turnover/i }),
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '80000');
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(80000 * 12);
  });

  it('slider drives the volume state', () => {
    render(
      <Step1Volume value={500000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2000000' } });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(2_000_000);
  });

  it('clicking a quick-pick chip sets the exact value', async () => {
    render(
      <Step1Volume value={0} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    // $5M chip
    await user.click(screen.getByRole('button', { name: /\$5M/i, pressed: false }));
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]!;
    expect(lastCall[0]).toBe(5_000_000);
  });

  it('active chip reflects exact-match volume', () => {
    render(
      <Step1Volume value={2_000_000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    const activeChip = screen.getByRole('button', { name: /\$2M/i, pressed: true });
    expect(activeChip).toBeInTheDocument();
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

  it('calls onBack when back button is clicked', async () => {
    render(
      <Step1Volume value={100000} onChange={onChange} onNext={onNext} onBack={onBack} />,
    );
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
