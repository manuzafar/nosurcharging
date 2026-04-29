import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockEmailGateShown, mockEmailCaptured, mockEmailGateSkipped } = vi.hoisted(() => ({
  mockEmailGateShown: vi.fn(),
  mockEmailCaptured: vi.fn(),
  mockEmailGateSkipped: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  Analytics: {
    emailGateShown: mockEmailGateShown,
    emailCaptured: mockEmailCaptured,
    emailGateSkipped: mockEmailGateSkipped,
  },
}));

import { EmailGate } from '@/components/assessment/EmailGate';

describe('EmailGate', () => {
  const onContinue = vi.fn();
  const onSkip = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders email input + CTA + skip link', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /see my results/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip and view now/i })).toBeInTheDocument();
    });

    it('consent checkbox is unchecked by default', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('progress label reads "04 / 04 ✓"', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(screen.getByText(/04 \/ 04/)).toBeInTheDocument();
    });

    it('heading reads "Where should we send it?"', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(
        screen.getByRole('heading', { name: /where should we send it/i }),
      ).toBeInTheDocument();
    });

    it('consent label contains the Spam-Act-compliant copy', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      expect(
        screen.getByText(/Send me practical payment insights/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Unsubscribe anytime/i)).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows invalid_email error for malformed email on CTA click', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'not-an-email');
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('does NOT show error when email is empty (skip path)', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('clears error when user types after error shown', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'bad');
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();

      await user.type(input, '@shop.com');
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
      await user.click(screen.getByRole('button', { name: /skip and view now/i }));
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('calls onSkip when CTA clicked with empty email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('calls onContinue(email, true) on valid email + consent ticked', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'merchant@shop.com.au');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(onContinue).toHaveBeenCalledWith('merchant@shop.com.au', true);
    });

    it('calls onContinue(email, false) on valid email, no consent', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'merchant@shop.com.au');
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(onContinue).toHaveBeenCalledWith('merchant@shop.com.au', false);
    });

    it('lowercases email before passing to onContinue', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'Merchant@Shop.COM');
      await user.click(screen.getByRole('button', { name: /see my results/i }));
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

    it('email input has accessible label', () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      // sr-only label with htmlFor binding satisfies the label query
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('aria-invalid set on email input when error shown', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'bad');
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('analytics', () => {
    it('fires email_gate_shown on mount with category', () => {
      render(<EmailGate category={3} onContinue={onContinue} onSkip={onSkip} />);
      expect(mockEmailGateShown).toHaveBeenCalledWith({ category: 3 });
    });

    it('fires email_captured on continue-with-email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      const input = screen.getByLabelText(/email address/i);
      await user.type(input, 'm@s.com');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(mockEmailCaptured).toHaveBeenCalledWith({ marketing_consent: true });
    });

    it('fires email_gate_skipped on skip-link click', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(screen.getByRole('button', { name: /skip and view now/i }));
      expect(mockEmailGateSkipped).toHaveBeenCalled();
    });

    it('fires email_gate_skipped on continue-with-empty-email', async () => {
      render(<EmailGate category={2} onContinue={onContinue} onSkip={onSkip} />);
      await user.click(screen.getByRole('button', { name: /see my results/i }));
      expect(mockEmailGateSkipped).toHaveBeenCalled();
      expect(mockEmailCaptured).not.toHaveBeenCalled();
    });
  });
});
