// packages/calculations/benchmark.ts
//
// Market benchmark sentence helper — RESULTS_CONTENT_CREDIBILITY_BRIEF.md
// Section 3.2. Pins three numbers together for the merchant: their
// reported MSF, the PSP's published list rate, and the post-reform
// wholesale floor for their card mix. Pure consumer of values already
// computed by the calculation engine; no math repeated.

import type {
  AssessmentOutputs,
  BenchmarkComparison,
  ResolvedAssessmentInputs,
} from './types';
import { PSP_PUBLISHED_RATES } from './constants/psp-rates';

// Minimum commercially-viable margin a PSP would have to charge on
// top of pure wholesale cost. Conservative — actual industry quotes
// settle around 0.20–0.50% even at scale.
const MIN_MARGIN_RATE = 0.002;

// Classification tolerance — within ±5bps counts as "at list".
const LIST_RATE_TOLERANCE = 0.0005;

export function buildBenchmarkComparison(
  inputs: ResolvedAssessmentInputs,
  outputs: AssessmentOutputs,
  pspKey: string,
): BenchmarkComparison {
  const caps = PSP_PUBLISHED_RATES[pspKey];

  // Engine-emitted fields are optional on the type for test-fixture
  // ergonomics; default to 0 here. Production never hits the defaults.
  const merchantRate = outputs.merchantEffectiveRate ?? 0;
  const volume = inputs.volume;
  const postReformFloor =
    (outputs.postReformIcRate ?? 0) +
    (outputs.weightedSchemeRate ?? 0) +
    MIN_MARGIN_RATE;

  // Unknown PSP or non-list-rate acquirer (banks, Adyen) → benchmark
  // against the wholesale floor only.
  if (!caps || caps.standardMsfIsListRate === false) {
    return {
      merchantRate,
      pspListRate: null,
      postReformFloor,
      comparison: 'no_list_anchor',
      potentialAnnualSaving: Math.max(
        0,
        Math.round((merchantRate - postReformFloor) * volume),
      ),
    };
  }

  const pspListRate = caps.standardMsf;
  const delta = merchantRate - pspListRate;

  let comparison: BenchmarkComparison['comparison'];
  let potentialAnnualSaving: number;
  if (delta > LIST_RATE_TOLERANCE) {
    comparison = 'above_list';
    potentialAnnualSaving = Math.round(delta * volume);
  } else if (delta < -LIST_RATE_TOLERANCE) {
    comparison = 'below_list';
    potentialAnnualSaving = Math.max(
      0,
      Math.round((merchantRate - postReformFloor) * volume),
    );
  } else {
    comparison = 'at_list';
    potentialAnnualSaving = Math.max(
      0,
      Math.round((merchantRate - postReformFloor) * volume),
    );
  }

  return {
    merchantRate,
    pspListRate,
    postReformFloor,
    comparison,
    potentialAnnualSaving,
  };
}
