Run all 6 verified calculation scenarios from docs/product/calculation-verification.md against the calculation engine.

For each scenario:
1. Construct the ResolvedAssessmentInputs using the scenario's inputs and default values
2. Call calculateMetrics() with those inputs and a pre-reform date (new Date('2026-04-01'))
3. Compare every output field to the expected values in the verification doc
4. Report PASS or FAIL with the expected vs actual values for any discrepancy

Scenarios to verify:
- Scenario 1: Cat 1, $2M, cost-plus, not surcharging -> plSwing = +$1,724.62
- Scenario 2: Cat 2, $2M, flat rate, not surcharging -> plSwing = $0 at 0% PT, +$776.08 at 45%, +$1,724.62 at 100%
- Scenario 3: Cat 3, $10M, cost-plus, surcharging 1.2% -> plSwing = -$111,376.92
- Scenario 4: Cat 4, $3M, flat rate, surcharging 1.2%, 45% PT -> plSwing = -$34,835.89
- Scenario 5: Expert mode, $5M, debit 7c (below cap) -> debitSaving = $0.00 exactly
- Scenario 6: Partial card mix normalisation -> breakdown sums to 1.0

Also verify invariants:
- todayScheme === oct2026Scheme for all scenarios
- No NaN or Infinity in any output
- debitSaving >= 0 always

Tolerance: $0.01 for monetary values, 0.001 for proportions.

Report a summary table at the end.
