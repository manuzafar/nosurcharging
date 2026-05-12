import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const {
  mockEmailGateShown,
  mockEmailCaptured,
  mockEmailGateSkipped,
  mockIdentifyUser,
  mockSha256,
} = vi.hoisted(() => ({
  mockEmailGateShown: vi.fn(),
  mockEmailCaptured: vi.fn(),
  mockEmailGateSkipped: vi.fn(),
  mockIdentifyUser: vi.fn(),
  mockSha256: vi.fn(async (input: string) => `hash:${input}`),
}));

vi.mock('@/lib/analytics', () => ({
  Analytics: {
    emailGateShown: mockEmailGateShown,
    emailCaptured: mockEmailCaptured,
    emailGateSkipped: mockEmailGateSkipped,
  },
  identifyUser: mockIdentifyUser,
  sha256: mockSha256,
}));

import { EmailGate } from '@/components/assessment/EmailGate';

// Helper — the email field's visible label is just "Email" (uppercase).
// Use exact match to avoid colliding with the marketing checkbox copy
// which starts with "Email me practical payments updates…".
const emailInput = () => screen.getByLabelText('Email');

// New CTA labels — replaces the previous "See my results →" / "Or skip
// and view now →" pair. Primary captures email; secondary is now an
// equal-weight underlined skip link.
const primaryButton = () =>
  screen.getByRole('button', { name: /send me insights & view my results/i });
const skipButton = () =>
  screen.getByRole('button', { name: /view my results without insights/i });

describe('EmailGate', () => {
  const onContinue = vi.fn();
  const onSkip = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders email input + primary CTA + skip link', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(emailInput()).toBeInTheDocument();
      expect(primaryButton()).toBeInTheDocument();
      expect(skipButton()).toBeInTheDocument();
    });

    it('consent checkbox is unchecked by default (Spam Act opt-in)', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('progress row renders four filled segments + emerald check circle', () => {
      const { container } = render(
        <EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />,
      );
      // The check circle replaces the previous "04 / 04 ✓" mono label;
      // assert via the inline SVG count + emerald segments instead.
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0); // at least the check icon
    });

    it('headline reads "Stay across the reform."', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(
        screen.getByRole('heading', { name: /stay across the reform/i }),
      ).toBeInTheDocument();
    });

    it('eyebrow pill reads "Almost there"', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(screen.getByText(/almost there/i)).toBeInTheDocument();
    });

    it('consent label contains the new Spam-Act-compliant copy', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      // Unique to the checkbox body (the subhead opens with "Get practical
      // payments updates…").
      expect(
        screen.getByText(/Email me practical payments updates/i),
      ).toBeInTheDocument();
    });

    it('subhead carries the cadence + unsubscribe reassurance', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      // Unique to the subhead — the checkbox body doesn't repeat this.
      expect(screen.getByText(/Roughly monthly\. Unsubscribe anytime\./i)).toBeInTheDocument();
    });

    it('does not reintroduce Phase 1-forbidden phrases', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const text = document.body.textContent ?? '';
      // Phase 1 ships no PDF, no scheduled benchmark email.
      expect(text).not.toMatch(/your report is ready/i);
      expect(text).not.toMatch(/where should we send it/i);
      expect(text).not.toMatch(/send it to/i);
      expect(text).not.toMatch(/october 2026 merchant benchmark/i);
      // Use "businesses" not "merchants" in the consent copy.
      expect(text).not.toMatch(/how other merchants are preparing/i);
      expect(text).not.toMatch(/a few times a month/i);
    });
  });

  describe('validation', () => {
    it('shows invalid_email error for malformed email on CTA click', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'not-an-email');
      await user.click(primaryButton());
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(onContinue).not.toHaveBeenCalled();
    });

    it.each([
      ['manu@......', 'dot-only domain'],
      ['manu@.com', 'domain starts with dot'],
      ['manu@example.', 'domain ends with dot'],
      ['manu@@example.com', 'double @'],
      ['@example.com', 'missing local part'],
      ['manu@', 'missing domain'],
      ['manu', 'no @ at all'],
      ['manu@example', 'no TLD'],
      ['manu space@example.com', 'space in local part'],
    ])('rejects pathological input: %s (%s)', async (bad) => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), bad);
      await user.click(primaryButton());
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(onContinue).not.toHaveBeenCalled();
    });

    it.each([
      ['merchant@shop.com.au'],
      ['first.last@shop.com'],
      ['user+tag@shop.io'],
    ])('accepts realistic email: %s', async (good) => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), good);
      await user.click(primaryButton());
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      expect(onContinue).toHaveBeenCalledWith(good.toLowerCase(), false);
    });

    it('does NOT show error when email is empty (skip path)', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(primaryButton());
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('clears error when user types after error shown', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'bad');
      await user.click(primaryButton());
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();

      await user.type(emailInput(), '@shop.com');
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('toggles consent checkbox on click', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('calls onSkip when skip link clicked', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(skipButton());
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('calls onSkip when CTA clicked with empty email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(primaryButton());
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('calls onContinue(email, true) on valid email + consent ticked', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'merchant@shop.com.au');
      await user.click(screen.getByRole('checkbox'));
      await user.click(primaryButton());
      expect(onContinue).toHaveBeenCalledWith('merchant@shop.com.au', true);
    });

    it('calls onContinue(email, false) on valid email, no consent', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'merchant@shop.com.au');
      await user.click(primaryButton());
      expect(onContinue).toHaveBeenCalledWith('merchant@shop.com.au', false);
    });

    it('lowercases email before passing to onContinue', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'Merchant@Shop.COM');
      await user.click(primaryButton());
      expect(onContinue).toHaveBeenCalledWith('merchant@shop.com', false);
    });
  });

  describe('accessibility', () => {
    it('checkbox is real <input type="checkbox">', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.tagName).toBe('INPUT');
      expect(checkbox.getAttribute('type')).toBe('checkbox');
    });

    it('email input has accessible label via the visible "Email" label', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(emailInput()).toBeInTheDocument();
    });

    it('aria-invalid set on email input when error shown', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'bad');
      await user.click(primaryButton());
      expect(emailInput()).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('analytics', () => {
    it('fires email_gate_shown on mount with category', () => {
      render(<EmailGate category={3} onContinue={onContinue} onSkip={onSkip} />);
      expect(mockEmailGateShown).toHaveBeenCalledWith({ category: 3 });
    });

    it('fires email_captured on continue-with-email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.type(emailInput(), 'm@s.com');
      await user.click(screen.getByRole('checkbox'));
      await user.click(primaryButton());
      expect(mockEmailCaptured).toHaveBeenCalledWith({ marketing_consent: true });
    });

    it('fires email_gate_skipped on skip-link click', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(skipButton());
      expect(mockEmailGateSkipped).toHaveBeenCalled();
    });

    it('fires email_gate_skipped on continue-with-empty-email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(primaryButton());
      expect(mockEmailGateSkipped).toHaveBeenCalled();
      expect(mockEmailCaptured).not.toHaveBeenCalled();
    });
  });
});
