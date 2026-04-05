'use client';

// FR-23: Assessment entry consent. Affirmative checkbox, not pre-checked.
// consent_type: "disclaimer", consent_version: "v1.0"
// Exact wording from docs/legal/disclaimer-text.md — do not change.

import { useState } from 'react';
import { AmberButton } from '@/components/ui/AmberButton';
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

  const handleStart = async () => {
    if (!checked) return;
    setLoading(true);

    try {
      const sessionId = await createSession();
      await recordConsent({
        consentType: 'disclaimer',
        consentText: DISCLAIMER_TEXT,
        consentVersion: DISCLAIMER_VERSION,
        consented: true,
        sessionId,
      });
      onAccept();
    } catch (err) {
      console.error('[disclaimer] Failed:', err);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-assessment px-5">
      <div className="mb-8 text-center">
        <p className="text-label tracking-widest text-amber-400">Free assessment</p>
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
          className="mt-0.5 h-4 w-4 rounded accent-amber-400"
        />
        <span className="text-body-sm text-gray-600 leading-relaxed">
          {DISCLAIMER_TEXT}
        </span>
      </label>

      <div className="mt-6 flex justify-center">
        <AmberButton onClick={handleStart} disabled={!checked || loading}>
          {loading ? 'Starting...' : 'Start assessment'}
        </AmberButton>
      </div>
    </div>
  );
}
