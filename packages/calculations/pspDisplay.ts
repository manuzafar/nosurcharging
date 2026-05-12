// packages/calculations/pspDisplay.ts
//
// Display-name resolver for the literal `'Other'` Step 2 fallback PSP.
//
// The string `'Other'` is the final entry in Step 2's PSP selector
// for merchants whose acquirer isn't in the registry. The raw value
// flows through ResolvedAssessmentInputs, the action builder, the
// stored assessment row, every analytics event, and every result-
// page prop — preserving cohort breakdowns and idempotency.
//
// It must NEVER appear in user-facing copy. Action scripts like
// "Call Other and ask what plan you will be transferred to" read
// as nonsense and destroy credibility on the surface that depends
// on PSP-specific clarity.
//
// `displayPspName` is the single substitution point. Every
// `${psp}` interpolation in user-visible action / script / why
// text and every `{pspName}` interpolation in results-page
// components routes through this helper. Internal branching logic
// (e.g. `if (psp === 'eWAY')` for the gateway-only action variant)
// continues to use the raw `psp` so capability gating is
// unaffected.

export function displayPspName(psp: string): string {
  return psp === 'Other' ? 'your payment provider' : psp;
}
