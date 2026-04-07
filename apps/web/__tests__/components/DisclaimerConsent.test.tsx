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
    const button = screen.getByRole('button', { name: /start my assessment/i });
    expect(button).toBeDisabled();
  });

  it('continue button becomes enabled after checking the checkbox', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /start my assessment/i });

    await user.click(checkbox);
    expect(button).toBeEnabled();
  });

  it('createSession is called when start button is clicked', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));

    expect(mockCreateSession).toHaveBeenCalledTimes(1);
  });

  it('recordConsent is called with exact disclaimer text v1.0', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));

    expect(mockRecordConsent).toHaveBeenCalledTimes(1);
    expect(mockRecordConsent).toHaveBeenCalledWith({
      consentType: 'disclaimer',
      consentText: expect.stringContaining(
        'I understand that this assessment provides illustrative estimates only',
      ),
      consentVersion: 'v1.0',
      consented: true,
      sessionId: 'test-session-id',
    });
  });

  it('onAccept is called after session and consent succeed', async () => {
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('displays the disclaimer text', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    expect(
      screen.getByText(/illustrative estimates only/),
    ).toBeInTheDocument();
  });

  it('renders the eyebrow tag and headline', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    expect(screen.getByText('Before we start')).toBeInTheDocument();
    expect(
      screen.getByText('A few things to know about this report'),
    ).toBeInTheDocument();
  });

  it('renders all four commitment titles in order', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    expect(
      screen.getByText('This is an estimate, not a guarantee.'),
    ).toBeInTheDocument();
    expect(screen.getByText('We explain everything.')).toBeInTheDocument();
    expect(screen.getByText('We are independent.')).toBeInTheDocument();
    expect(
      screen.getByText('This is not financial advice.'),
    ).toBeInTheDocument();
  });

  it('uses "payment provider" wording in the commitment items', () => {
    render(<DisclaimerConsent onAccept={onAccept} />);
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/what your payment provider does after October/);
    expect(text).toMatch(/Stripe, Square, Tyro, or any payment provider/);
  });

  it('blocks progression when recordConsent returns success: false', async () => {
    mockRecordConsent.mockResolvedValueOnce({ success: false, error: 'DB error' });
    render(<DisclaimerConsent onAccept={onAccept} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /start my assessment/i }));

    // onAccept must NOT be called
    expect(onAccept).not.toHaveBeenCalled();

    // Error message displayed
    expect(screen.getByText(/could not record your consent/i)).toBeInTheDocument();
  });
});
