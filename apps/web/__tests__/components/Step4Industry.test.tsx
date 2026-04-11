import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step4Industry } from '@/components/assessment/Step4Industry';

describe('Step4Industry', () => {
  const onIndustryChange = vi.fn();
  const onNext = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 6 industry tiles', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    const industries = [
      'Cafe / Restaurant',
      'Hospitality group',
      'Retail',
      'Online store',
      'Ticketing / Events',
      'Other',
    ];
    for (const label of industries) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('clicking a tile selects it', async () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByText('Retail'));
    expect(onIndustryChange).toHaveBeenCalledWith('retail');
  });

  it('clicking another tile deselects the first', async () => {
    const { rerender } = render(
      <Step4Industry
        industry="retail"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByText('Online store'));
    expect(onIndustryChange).toHaveBeenCalledWith('online');

    // Rerender with new selection — only one tile should have selected styling
    rerender(
      <Step4Industry
        industry="online"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    // The online store button should have accent border class
    const onlineBtn = screen.getByText('Online store').closest('button')!;
    expect(onlineBtn.className).toContain('accent');

    // The retail button should not
    const retailBtn = screen.getByText('Retail').closest('button')!;
    expect(retailBtn.className).not.toContain('accent');
  });

  it('only one tile can be selected at a time', () => {
    render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    // Count tiles with accent in className (should be exactly 1)
    const allButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent !== 'Back' && btn.textContent !== 'See my results →',
    );
    const selectedButtons = allButtons.filter((btn) =>
      btn.className.includes('accent'),
    );
    expect(selectedButtons).toHaveLength(1);
  });

  it('See my results button disabled when no industry selected', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByRole('button', { name: /see my results/i })).toBeDisabled();
  });

  it('See my results button enabled when industry selected', () => {
    render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByRole('button', { name: /see my results/i })).toBeEnabled();
  });
});
