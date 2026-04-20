'use client';

// FeedbackModal — portal-based overlay for "Result looks off?" feedback.
// Triggered from ResultsTopBar. Email optional. Textarea required.

import { useId, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { submitFeedback } from '@/actions/submitFeedback';
import { trackEvent } from '@/lib/analytics';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  category: 1 | 2 | 3 | 4;
  volume: number;
  assessmentId?: string;
}

type FormState = 'default' | 'loading' | 'success' | 'error';

export function FeedbackModal({ open, onClose, category, volume, assessmentId }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('default');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const emailId = useId();
  const messageId = useId();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Track open
  useEffect(() => {
    if (open) {
      trackEvent('Feedback opened', { category: String(category) });
    }
  }, [open, category]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setState('loading');
    setErrorMsg(null);

    const result = await submitFeedback({
      category,
      volume,
      assessmentId,
      email: email.trim() || undefined,
      message: message.trim(),
    });

    if (result.success) {
      setState('success');
      trackEvent('Feedback submitted', { category: String(category) });
    } else {
      setState('error');
      setErrorMsg(result.error ?? 'Something went wrong. Try again.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26, 20, 9, 0.5)',
      }}
    >
      <div
        className="rounded-lg"
        style={{
          background: 'var(--color-background-primary)',
          width: '100%',
          maxWidth: '440px',
          margin: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-medium"
            style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}
          >
            Result looks off?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              fontSize: '18px',
              lineHeight: 1,
              color: 'var(--color-text-tertiary)',
            }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {state === 'success' ? (
          <div
            className="rounded-lg p-4"
            style={{
              background: 'var(--color-background-success)',
              border: '0.5px solid var(--color-border-success)',
            }}
          >
            <p className="text-body-sm" style={{ color: 'var(--color-text-success)' }}>
              Thanks — we&apos;ll read every word.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor={messageId}
              className="text-caption"
              style={{ color: 'var(--color-text-primary)' }}
            >
              What looks off?
            </label>
            <textarea
              id={messageId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              required
              placeholder="e.g. the saving feels too small, or the rate isn't what I pay..."
              className="mt-1 w-full rounded-lg px-3 py-2 text-body-sm outline-none"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
              }}
            />

            <label
              htmlFor={emailId}
              className="mt-3 block text-caption"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Email (optional — only if you&apos;d like a reply)
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com.au"
              className="mt-1 w-full rounded-lg px-3 text-body-sm outline-none min-h-[44px]"
              style={{
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
              }}
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={state === 'loading' || !message.trim()}
                className="rounded-full px-5 text-body-sm font-medium shrink-0 min-h-[44px]
                  disabled:opacity-50 transition-opacity duration-150"
                style={{ background: '#1A6B5A', color: '#EBF6F3' }}
              >
                {state === 'loading' ? 'Sending...' : 'Send feedback'}
              </button>
              {state === 'error' && errorMsg && (
                <p className="text-caption" style={{ color: 'var(--color-text-danger)' }}>
                  {errorMsg}
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
