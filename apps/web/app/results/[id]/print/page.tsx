'use client';

// Print-friendly results route — Ruthless Cut M2 fallback.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §7 fallback path:
// merchant can browser-Save-as-PDF before the full React-PDF report
// arrives by email. Renders the static results content (verdict,
// context, metrics, problems, action steps, timeline) with no email
// form, no refinement panel, no upsell, no top bar.
//
// Read-only. No interactive controls. The page is intentionally
// stateless — slider/refinement edits are not possible from here.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAssessment } from '@/actions/getAssessment';
import type { StoredAssessment } from '@/actions/getAssessment';
import type {
  AssessmentOutputs,
  ActionItem,
} from '@nosurcharging/calculations/types';
import { sanitiseForHTML } from '@/lib/sanitise';

import { VerdictSection } from '@/components/results/VerdictSection';
import { ContextParagraph } from '@/components/results/ContextParagraph';
import { MetricCards } from '@/components/results/MetricCards';
import { ProblemsBlock } from '@/components/results/ProblemsBlock';
import { VerticalActionSteps } from '@/components/results/VerticalActionSteps';
import { ReformTimelineCompact } from '@/components/results/sections/ReformTimelineCompact';
import { ResultsDisclaimer } from '@/components/results/ResultsDisclaimer';

export default function PrintResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [assessment, setAssessment] = useState<StoredAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getAssessment(id).then((result) => {
      if (result.success && result.data) {
        setAssessment(result.data);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-6">
        <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
          Preparing print view…
        </p>
      </main>
    );
  }

  if (!assessment) {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-6">
        <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
          Assessment not found.
        </p>
      </main>
    );
  }

  if (assessment.variant_type === 'strategic_rate') {
    return (
      <main className="mx-auto max-w-3xl px-5 pt-6">
        <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
          This assessment is on the strategic-rate exit path and has no
          printable report. See your results page for next steps.
        </p>
      </main>
    );
  }

  const outputs = assessment.outputs as AssessmentOutputs;
  const actions =
    (assessment.outputs as { actions?: ActionItem[] }).actions ?? [];
  const storedInputs = assessment.inputs as Record<string, unknown>;
  const category = outputs.category;
  const volume = (storedInputs.volume as number) ?? 0;
  const pspName = sanitiseForHTML((storedInputs.psp as string) ?? 'Unknown');
  const planType =
    (storedInputs.planType as 'flat' | 'costplus' | 'blended' | 'zero_cost') ??
    'flat';

  return (
    <>
      {/* Print styles — fit the page to A4-ish, drop colours that don't
          carry to greyscale, ensure each section can break naturally. */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm;
          }
          body {
            background: #fff !important;
          }
          section {
            break-inside: avoid;
          }
          a {
            text-decoration: none !important;
          }
        }
      `}</style>

      <main className="mx-auto max-w-3xl px-5 pt-6 pb-8 space-y-8 bg-paper">
        <VerdictSection outputs={outputs} />
        <ContextParagraph category={category} pspName={pspName} />
        <MetricCards
          outputs={outputs}
          planType={planType}
          volume={volume}
        />
        <ProblemsBlock
          category={category}
          pspName={pspName}
          surchargeRevenue={outputs.surchargeRevenue}
          icSaving={outputs.icSaving}
          octNet={outputs.octNet}
          estimatedMSFRate={outputs.estimatedMSFRate}
        />
        <VerticalActionSteps actions={actions} />
        <ReformTimelineCompact />
        <ResultsDisclaimer />
        <p
          style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          Generated{' '}
          {new Date(assessment.created_at).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · nosurcharging.com.au
        </p>
      </main>
    </>
  );
}
