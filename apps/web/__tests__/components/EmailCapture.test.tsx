import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockCaptureEmail } = vi.hoisted(() => ({
  mockCaptureEmail: vi.fn(),
}));

vi.mock('@/actions/captureEmail', () => ({
  captureEmail: mockCaptureEmail,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  Analytics: { emailCaptured: vi.fn() },
  identifyUser: vi.fn(),
  getPlSwingBucket: vi.fn(() => '0-5k_gain'),
}));

vi.mock('@/lib/hashEmail', () => ({
  hashEmail: vi.fn().mockResolvedValue('mockhash'),
}));

import { EmailCapture } from '@/components/results/EmailCapture';

describe('EmailCapture', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows success state after captureEmail resolves', async () => {
    mockCaptureEmail.mockResolvedValueOnce({ success: true });

    render(<EmailCapture assessmentId="test-id" />);

    await user.type(screen.getByPlaceholderText(/business.com.au/), 'test@shop.com');
    await user.click(screen.getByRole('button', { name: /get notified/i }));

    expect(await screen.findByText(/on the list for 30 October/)).toBeInTheDocument();
  });

  it('shows rate-limit state when already signed up', async () => {
    mockCaptureEmail.mockResolvedValueOnce({
      success: false,
      error: "You've already signed up. One email on 30 October.",
    });

    render(<EmailCapture assessmentId="test-id" />);

    await user.type(screen.getByPlaceholderText(/business.com.au/), 'test@shop.com');
    await user.click(screen.getByRole('button', { name: /get notified/i }));

    expect(await screen.findByText(/already signed up/)).toBeInTheDocument();
  });

  it('input and button are replaced on success (not just hidden)', async () => {
    mockCaptureEmail.mockResolvedValueOnce({ success: true });

    render(<EmailCapture assessmentId="test-id" />);

    await user.type(screen.getByPlaceholderText(/business.com.au/), 'test@shop.com');
    await user.click(screen.getByRole('button', { name: /get notified/i }));

    // Wait for success state
    await screen.findByText(/on the list/);

    // Input and button should no longer exist — not just hidden
    expect(screen.queryByPlaceholderText(/business.com.au/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /get notified/i })).not.toBeInTheDocument();
  });

  it('shows Phase 2 teaser button (disabled)', () => {
    render(<EmailCapture />);
    const phaseBtn = screen.getByText(/coming in phase 2/i);
    expect(phaseBtn.closest('button')).toBeDisabled();
  });

  it('shows contractual privacy note', () => {
    render(<EmailCapture />);
    expect(
      screen.getByText(/one email on 30 october.*not shared with any payment provider/i),
    ).toBeInTheDocument();
  });
});
