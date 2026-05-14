import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2PlanType } from '@/components/assessment/Step2PlanType';

// Step 2 v2 (May 2026) — single radio list of six equal-weight plan-type
// cards. Tests assert the new structure: aria-labels match the brief's
// verbatim titles, no hairline dividers, chips on cards 1+2 only, PSP grid
// in the new 3-col-desktop order, "Refine my rates" panel gated on PSP
// selection.

describe('Step2PlanType (v2)', () => {
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
    msfRate: 0.014,
    onMsfRateChange: vi.fn(),
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

  // ── Structure ──────────────────────────────────────────────────────

  it('renders all six plan-type radio cards in the brief order', () => {
    render(<Step2PlanType {...defaultProps} />);
    const titles = [
      'Single rate (flat %)',
      'Not sure',
      'IC++ (Interchange Plus)',
      'Blended',
      'Zero-cost EFTPOS',
      'Strategic / custom',
    ];
    for (const title of titles) {
      expect(screen.getByRole('radio', { name: title })).toBeInTheDocument();
    }
  });

  it('headline + subhead use the new verbatim copy', () => {
    render(<Step2PlanType {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: /how do you pay for card acceptance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This helps us estimate your current cost structure and project the impact/,
      ),
    ).toBeInTheDocument();
  });

  it('uses the new section labels "Pricing model" and "Payment provider"', () => {
    render(<Step2PlanType {...defaultProps} />);
    expect(screen.getByText('Pricing model')).toBeInTheDocument();
    expect(screen.getByText('Payment provider')).toBeInTheDocument();
    // Old labels must not reappear
    expect(screen.queryByText(/Your plan type/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Who processes your payments\?/i)).not.toBeInTheDocument();
  });

  it('renders no hairline dividers inside the plan-type question', () => {
    render(<Step2PlanType {...defaultProps} />);
    const text = document.body.textContent ?? '';
    // The v1 dividers carried these labels; both are now forbidden.
    expect(text).not.toMatch(/If you recognise one of these/i);
    expect(text).not.toMatch(/(^|\s)Or(\s|$)/);
  });

  // ── Chips ──────────────────────────────────────────────────────────

  it('renders "Most common" chip on the Flat card only', () => {
    render(<Step2PlanType {...defaultProps} />);
    const chips = screen.getAllByText('Most common');
    expect(chips).toHaveLength(1);
    // Chip must live inside the Flat radio card
    const flatCard = screen.getByRole('radio', { name: 'Single rate (flat %)' });
    expect(flatCard.textContent).toContain('Most common');
  });

  it('renders "Smart defaults" chip on the Not-sure card only', () => {
    render(<Step2PlanType {...defaultProps} />);
    const chips = screen.getAllByText('Smart defaults');
    expect(chips).toHaveLength(1);
    const notSureCard = screen.getByRole('radio', { name: 'Not sure' });
    expect(notSureCard.textContent).toContain('Smart defaults');
  });

  // ── Selection behaviour ────────────────────────────────────────────

  it('clicking the Flat card fires onPlanTypeChange("flat", false)', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'Single rate (flat %)' }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('flat', false);
  });

  it('clicking the Not-sure card fires onPlanTypeChange("flat", true)', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'Not sure' }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('flat', true);
  });

  it('clicking IC++ fires onPlanTypeChange("costplus", false)', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'IC++ (Interchange Plus)' }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('costplus', false);
  });

  it('clicking Blended fires onPlanTypeChange("blended", false)', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'Blended' }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('blended', false);
  });

  it('clicking Zero-cost EFTPOS fires onPlanTypeChange("zero_cost", false)', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'Zero-cost EFTPOS' }));
    expect(onPlanTypeChange).toHaveBeenCalledWith('zero_cost', false);
  });

  it('selected card carries aria-checked=true; others stay false', () => {
    render(<Step2PlanType {...defaultProps} planType="costplus" />);
    expect(
      screen.getByRole('radio', { name: 'IC++ (Interchange Plus)' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('radio', { name: 'Single rate (flat %)' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(
      screen.getByRole('radio', { name: 'Strategic / custom' }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  // ── PSP grid ───────────────────────────────────────────────────────

  it('renders all 10 PSP options including the renamed display labels', () => {
    render(<Step2PlanType {...defaultProps} />);
    const namedPsps = ['Stripe', 'Square', 'Tyro', 'Zeller', 'Adyen', 'eWAY', 'CommBank', 'Westpac'];
    for (const psp of namedPsps) {
      expect(screen.getByRole('radio', { name: psp })).toBeInTheDocument();
    }
    expect(
      screen.getByRole('radio', { name: 'ANZ Worldline' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Other / Not listed' }),
    ).toBeInTheDocument();
  });

  it('clicking a PSP fires onPspChange with the underlying key, not the display label', async () => {
    render(<Step2PlanType {...defaultProps} />);
    await user.click(screen.getByRole('radio', { name: 'ANZ Worldline' }));
    // Key stays 'ANZ' — display label is purely render-time
    expect(onPspChange).toHaveBeenCalledWith('ANZ');

    await user.click(screen.getByRole('radio', { name: 'Other / Not listed' }));
    expect(onPspChange).toHaveBeenCalledWith('Other');
  });

  // ── Refine my rates panel gating ───────────────────────────────────

  it('Refine my rates panel is NOT rendered until a PSP is selected', () => {
    render(<Step2PlanType {...defaultProps} planType="flat" />);
    expect(
      screen.queryByText(/Refine my rates/i),
    ).not.toBeInTheDocument();
  });

  it('Refine my rates panel renders once a PSP is selected', () => {
    render(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    expect(screen.getByText(/Refine my rates/i)).toBeInTheDocument();
  });

  it('Refine my rates panel is collapsed by default — body fields hidden', () => {
    render(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    // Header visible; auto-shown flat-rate input not yet in the DOM
    expect(screen.getByText(/Refine my rates/i)).toBeInTheDocument();
    expect(screen.queryByText(/Your Stripe rate/i)).not.toBeInTheDocument();
  });

  it('clicking the Refine header expands the panel and reveals flat-rate input', async () => {
    render(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    await user.click(screen.getByRole('button', { name: /Refine my rates/i }));
    expect(screen.getByText(/Your Stripe rate/i)).toBeInTheDocument();
  });

  it('Refine panel subtitle changes when Not-sure was selected', async () => {
    // The "Not sure" cohort stores planType='flat' + isUnknown=true. The
    // panel is rendered, but the subtitle text changes and the flat-rate
    // input is suppressed.
    render(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    // First click Not sure so isUnknown becomes true
    await user.click(screen.getByRole('radio', { name: 'Not sure' }));
    // The component derives isUnknown locally — re-render not needed
    expect(
      screen.getByText(/You picked 'Not sure'/),
    ).toBeInTheDocument();
  });

  // ── Continue gating ────────────────────────────────────────────────

  it('Continue is disabled until BOTH plan type AND PSP are selected', () => {
    const { rerender } = render(<Step2PlanType {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();

    rerender(<Step2PlanType {...defaultProps} planType="flat" />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();

    rerender(<Step2PlanType {...defaultProps} psp="Stripe" />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();

    rerender(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled();
  });

  it('Continue copy is "Continue" not the legacy "Next"', () => {
    render(<Step2PlanType {...defaultProps} planType="flat" psp="Stripe" />);
    expect(
      screen.getByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();
  });

  // ── Strategic-rate path ────────────────────────────────────────────

  it('selecting Strategic / custom enables Continue without a PSP', async () => {
    const onStrategicRateSelected = vi.fn();
    render(
      <Step2PlanType
        {...defaultProps}
        onStrategicRateSelected={onStrategicRateSelected}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Strategic / custom' }));
    const continueBtn = screen.getByRole('button', { name: /continue/i });
    expect(continueBtn).toBeEnabled();
    await user.click(continueBtn);
    expect(onStrategicRateSelected).toHaveBeenCalled();
  });

  // ── Forbidden phrases (regression guards) ──────────────────────────

  it('does not render forbidden v1 phrases', () => {
    render(<Step2PlanType {...defaultProps} />);
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/Pick the description that sounds most like your situation/i);
    expect(text).not.toMatch(/Your plan type/i);
    expect(text).not.toMatch(/Who processes your payments\?/i);
    expect(text).not.toMatch(/If you recognise one of these/i);
    expect(text).not.toMatch(/Payment wizard\?/i);
  });
});
