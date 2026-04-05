import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardMixInput } from '@/components/assessment/CardMixInput';
import type { CardMixInput as CardMixInputType } from '@nosurcharging/calculations/types';

describe('CardMixInput', () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('panel is collapsed by default (toggle shows expand text)', () => {
    render(<CardMixInput value={{}} onChange={onChange} />);
    // The toggle text shows the "expand" prompt — confirming collapsed state
    expect(screen.getByRole('button', { name: /know your card mix/i })).toBeInTheDocument();
    // The "Use default" collapse text should NOT be present
    expect(screen.queryByText(/use default card mix/i)).not.toBeInTheDocument();
  });

  it('opens when toggle clicked', async () => {
    render(<CardMixInput value={{}} onChange={onChange} />);
    await user.click(screen.getByText(/know your card mix/i));
    expect(screen.getByText(/how your customers/i)).toBeVisible();
    // All 7 scheme fields render
    expect(screen.getByText('Visa debit')).toBeVisible();
    expect(screen.getByText('Amex')).toBeVisible();
    expect(screen.getByText('Foreign cards')).toBeVisible();
  });

  it('live total updates as fields change', async () => {
    // Start with visa_debit at 60%
    const currentValue: CardMixInputType = { visa_debit: 0.60 };
    const { rerender } = render(
      <CardMixInput value={currentValue} onChange={onChange} />,
    );

    // Open panel
    await user.click(screen.getByText(/know your card mix/i));

    // Total should show 60%
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Simulate parent re-rendering with additional field
    rerender(
      <CardMixInput
        value={{ visa_debit: 0.60, visa_credit: 0.40 }}
        onChange={onChange}
      />,
    );

    // Total should show 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows green at 100%, amber when off', async () => {
    // At exactly 100%
    const { rerender } = render(
      <CardMixInput value={{ visa_debit: 0.60, visa_credit: 0.40 }} onChange={onChange} />,
    );
    await user.click(screen.getByText(/know your card mix/i));

    const total100 = screen.getByText('100%');
    expect(total100.className).toContain('green');

    // At 80% — amber
    rerender(
      <CardMixInput value={{ visa_debit: 0.60, visa_credit: 0.20 }} onChange={onChange} />,
    );

    const total80 = screen.getByText('80%');
    expect(total80.className).toContain('amber');
  });

  it('shows adjustment message when total is off by more than 1%', async () => {
    render(
      <CardMixInput value={{ visa_debit: 0.60, amex: 0.05 }} onChange={onChange} />,
    );
    await user.click(screen.getByText(/know your card mix/i));

    // Total = 65%, which is off — should show adjustment message
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText(/adjust to 100/i)).toBeInTheDocument();
  });

  it('never blocks progression (no validation error that prevents Next)', async () => {
    // Even with weird totals like 200%, the component renders without error
    // and doesn't disable anything — it just shows the total
    render(
      <CardMixInput
        value={{ visa_debit: 1.0, visa_credit: 1.0 }}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByText(/know your card mix/i));

    // Total shows 200% but no error, no disabled state
    expect(screen.getByText('200%')).toBeInTheDocument();
    // There's no "error" or "invalid" role/text blocking progression
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onChange when a field value changes', async () => {
    render(<CardMixInput value={{}} onChange={onChange} />);
    await user.click(screen.getByText(/know your card mix/i));

    // Get all spinbutton inputs
    const inputs = screen.getAllByRole('spinbutton');
    // Type in the first field (Visa debit) — user.type fires per-keystroke
    // '6' fires first (0.06), then '0' fires (but input now reads '60' if controlled)
    // Since value={} and component reads from props, each keystroke fires onChange
    // with the current field value / 100. Check that onChange was called.
    await user.type(inputs[0]!, '6');

    expect(onChange).toHaveBeenCalled();
    // Single digit '6' → parseFloat('6') / 100 = 0.06
    const firstCall = onChange.mock.calls[0]![0];
    expect(firstCall.visa_debit).toBeCloseTo(0.06, 3);
  });

  it('shows dash for total when no fields filled', async () => {
    render(<CardMixInput value={{}} onChange={onChange} />);
    await user.click(screen.getByText(/know your card mix/i));

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
