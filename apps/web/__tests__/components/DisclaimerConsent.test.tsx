import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Hoisted mocks ────────────────────────────────────────────────

const { mockCreateSession, mockRecordConsent } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
  mockRecordConsent: vi.fn(),
}));

vi.mock('@/actions/createSession', () => ({
  createSession: mockCreateSession,
}));

vi.mock('@/actions/recordConsent', () => ({
  recordConsent: mockRecordConsent,
}));

// ── Import after mocks ───────────────────────────────────────────

import { DisclaimerConsent } from '@/components/assessment/DisclaimerConsent';

// ── Tests ────────────────────────────────────────────────────────

describe('DisclaimerConsent', () => {
  const onAccept = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSession.mockResolvedValue('test-session-id');
    mockRecordConsent.mockResolvedValue({ success: true });
  });

  it('checkbox is unchecked by default', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('continue button is disabled until checkbox is checked', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    const button = screen.getByRole('button', { name: /start assessment/i });
    expect(button).toBeDisabled();
  });

  it('continue button becomes enabled after checking the checkbox', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /start assessment/i });

    await user.click(checkbox);
    expect(button).toBeEnabled();
  });

  it('createSession is called when start button is clicked', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start assessment/i }));

    expect(mockCreateSession).toHaveBeenCalledTimes(1);
  });

  it('recordConsent is called with exact disclaimer text v1.0', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start assessment/i }));

    expect(mockRecordConsent).toHaveBeenCalledTimes(1);
    expect(mockRecordConsent).toHaveBeenCalledWith({
      consentType: 'disclaimer',
      consentText: expect.stringContaining(
        'I understand that this assessment provides illustrative estimates only',
      ),
      consentVersion: 'v1.0',
      consented: true,
    });
  });

  it('onAccept is called after session and consent succeed', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start assessment/i }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('displays the disclaimer text', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    expect(
      screen.getByText(/illustrative estimates only/),
    ).toBeInTheDocument();
  });
});
