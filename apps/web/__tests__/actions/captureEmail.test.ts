import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const VALID_ID = '123e4567-e89b-12d3-a456-426614174000';

const { mockSelectSingle, mockUpdateEq, mockResendSend } = vi.hoisted(() => ({
  mockSelectSingle: vi.fn(),
  mockUpdateEq: vi.fn(),
  mockResendSend: vi.fn(),
}));

// Supabase admin mock — chainable from(...).select(...).eq(...).single()
//                       and from(...).update(...).eq(...)
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSelectSingle,
        })),
      })),
      update: vi.fn(() => ({
        eq: mockUpdateEq,
      })),
    })),
  },
}));

vi.mock('@/lib/security', () => ({
  sanitiseForHTML: (s: string) => s,
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

// Stable outputs row used by the select() mock
const OUTPUTS_ROW = {
  outputs: {
    category: 4,
    icSaving: 1000,
    debitSaving: 200,
    creditSaving: 800,
    todayInterchange: 5000,
    todayMargin: 2000,
    grossCOA: 10000,
    annualMSF: 28000,
    surchargeRevenue: 7500,
    netToday: 20500,
    octNet: 28000,
    plSwing: -7500,
    plSwingLow: -7500,
    plSwingHigh: -7500,
    rangeDriver: 'card_mix',
    rangeNote: '',
    todayScheme: 2100,
    oct2026Scheme: 2100,
    confidence: 'low',
    period: 'pre_reform',
    actions: [
      {
        priority: 'urgent',
        timeAnchor: 'BEFORE 1 OCTOBER',
        text: 'Plan the $7,500 in surcharge revenue',
        script: '',
        why: '',
      },
    ],
  },
};

// Import AFTER mocks
import { captureEmail } from '@/actions/captureEmail';

describe('captureEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectSingle.mockResolvedValue({ data: OUTPUTS_ROW, error: null });
    mockUpdateEq.mockResolvedValue({ data: null, error: null });
    mockResendSend.mockResolvedValue({ id: 'resend-id' });
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('RESEND_FROM', 'results@nosurcharging.com.au');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('validation', () => {
    it('rejects malformed assessmentId', async () => {
      const result = await captureEmail({ assessmentId: 'not-a-uuid', email: 'm@s.com' });
      expect(result).toEqual({ success: false, error: 'invalid_assessment_id' });
    });

    it('returns success without sending when email is empty', async () => {
      const result = await captureEmail({ assessmentId: VALID_ID, email: '' });
      expect(result).toEqual({ success: true });
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('lowercases email before sending', async () => {
      await captureEmail({ assessmentId: VALID_ID, email: 'Merchant@Shop.COM' });
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'merchant@shop.com' }),
      );
    });

    it('trims email before sending', async () => {
      await captureEmail({ assessmentId: VALID_ID, email: '  m@s.com  ' });
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'm@s.com' }),
      );
    });
  });

  describe('Resend behaviour', () => {
    it('skips send when RESEND_API_KEY is not set, still returns success', async () => {
      vi.stubEnv('RESEND_API_KEY', '');
      const result = await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(result).toEqual({ success: true });
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('uses RESEND_FROM env, falls back to results@nosurcharging.com.au', async () => {
      vi.stubEnv('RESEND_FROM', '');
      await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'results@nosurcharging.com.au' }),
      );
    });

    it('subject line matches spec', async () => {
      await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your payments reform assessment — nosurcharging.com.au',
        }),
      );
    });

    it('body contains category, verdict, plSwing, reportUrl, firstAction', async () => {
      await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      const text = (mockResendSend.mock.calls[0]![0] as { text: string }).text;
      expect(text).toContain('Situation 4');
      expect(text).toContain('You face both challenges simultaneously');
      expect(text).toContain('−$7,500');
      expect(text).toContain(`https://nosurcharging.com.au/results?id=${VALID_ID}`);
      expect(text).toContain('Plan the $7,500 in surcharge revenue');
    });

    it('falls back to default firstAction when actions[] empty', async () => {
      mockSelectSingle.mockResolvedValueOnce({
        data: { outputs: { ...OUTPUTS_ROW.outputs, actions: [] } },
        error: null,
      });
      await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      const text = (mockResendSend.mock.calls[0]![0] as { text: string }).text;
      expect(text).toContain('Open your full report and review the action plan.');
    });

    it('returns success even when outputs fetch fails', async () => {
      mockSelectSingle.mockResolvedValueOnce({ data: null, error: { message: 'fetch failed' } });
      const result = await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(result).toEqual({ success: true });
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('Resend failure does not fail the action', async () => {
      mockResendSend.mockRejectedValueOnce(new Error('rate limit'));
      const result = await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(result).toEqual({ success: true });
      // email_report_sent UPDATE should not have run on Resend failure
      expect(mockUpdateEq).not.toHaveBeenCalled();
    });

    it('stamps email_report_sent + email_report_sent_at after successful send', async () => {
      await captureEmail({ assessmentId: VALID_ID, email: 'm@s.com' });
      expect(mockUpdateEq).toHaveBeenCalledTimes(1);
    });
  });
});
