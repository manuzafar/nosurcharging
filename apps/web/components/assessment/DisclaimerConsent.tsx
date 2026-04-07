'use client';

// FR-23: Assessment entry consent. Affirmative checkbox, not pre-checked.
// consent_type: "disclaimer", consent_version: "v1.0"
// Exact wording from docs/legal/disclaimer-text.md — do not change.

import { useState } from 'react';
import Link from 'next/link';
import { AccentButton } from '@/components/ui/AccentButton';
import { createSession } from '@/actions/createSession';
import { recordConsent } from '@/actions/recordConsent';

const DISCLAIMER_TEXT =
  'I understand that this assessment provides illustrative estimates only. It is not financial advice. Figures are based on RBA published data and the information I provide. I should verify any figures with my PSP before making business decisions.';
const DISCLAIMER_VERSION = 'v1.0';

interface DisclaimerConsentProps {
  onAccept: () => void;
}

export function DisclaimerConsent({ onAccept }: DisclaimerConsentProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const handleStart = async () => {
    if (!checked) return;
    setLoading(true);
    setConsentError(false);

    try {
      const sessionId = await createSession();
      const result = await recordConsent({
        consentType: 'disclaimer',
        consentText: DISCLAIMER_TEXT,
        consentVersion: DISCLAIMER_VERSION,
        consented: true,
        sessionId,
      });

      if (!result.success) {
        setConsentError(true);
        setLoading(false);
        return;
      }

      onAccept();
    } catch (err) {
      console.error('[disclaimer] Failed:', err);
      setConsentError(true);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-assessment px-5">
      <div className="mb-8 text-center">
        <p className="text-label tracking-widest text-accent">Free assessment</p>
        <h1 className="mt-3 font-serif text-heading-lg">
          What does the RBA reform mean for your P&L?
        </h1>
        <p className="mt-3 text-body text-gray-500 leading-relaxed">
          Four questions. Under five minutes. No account required.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-accent"
        />
        <span className="text-body-sm text-gray-600 leading-relaxed">
          {DISCLAIMER_TEXT}
        </span>
      </label>
      <p className="mt-2 text-center">
        <Link href="/privacy" className="text-caption underline" style={{ color: 'var(--color-text-secondary)' }}>
          Read our privacy policy
        </Link>
      </p>

      {consentError && (
        <p className="mt-4 text-center text-body-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
          We could not record your consent. Please try again or contact us.
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <AccentButton onClick={handleStart} disabled={!checked || loading}>
          {loading ? 'Starting...' : 'Start assessment'}
        </AccentButton>
      </div>
    </div>
  );
}
