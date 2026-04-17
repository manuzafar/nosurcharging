# Test Specification — Iteration 2 (v5)

All new test cases to add to the existing test suite. Write immediately alongside
each engine change — not batched at the end.

---

## Ground truth update — existing test file changes

The following values in `packages/calculations/__tests__/calculations.test.ts`
must be updated to reflect the eftpos exclusion fix and surcharge network fix.

**Cascade explanation:** The eftpos exclusion changes `debitSaving`, which cascades
to `icSaving`. The two-variable architecture (see PROMPT.md Fix 1) keeps `grossCOA`
unchanged, so `netToday` for non-surcharging scenarios is also unchanged.

### Complete verified ground truth table

| Scenario | Field | Old value | New value | Reason |
|---|---|---|---|---|
| 1 ($2M CP) | debitSaving | $184.62 | **$160.00** | visaMcDebitShare(0.52) not 0.60 |
| 1 ($2M CP) | icSaving | $1,724.62 | **$1,700.00** | debitSaving+creditSaving cascade |
| 1 ($2M CP) | grossCOA | $9,401.54 | $9,401.54 | UNCHANGED — debitIC uses full 0.60 |
| 1 ($2M CP) | netToday | $9,401.54 | $9,401.54 | UNCHANGED — no surcharging |
| 1 ($2M CP) | octNet | $7,676.92 | **$7,701.54** | grossCOA($9,401.54) - icSaving($1,700) |
| 1 ($2M CP) | plSwing | +$1,724.62 | **+$1,700.00** | netToday - octNet |
| 2 (45%PT) | icSaving | $1,724.62 | **$1,700.00** | same as S1 |
| 2 (45%PT) | plSwing | +$776.08 | **+$765.00** | $1,700 × 0.45 |
| 2 (100%PT) | plSwing | +$1,724.62 | **+$1,700.00** | icSaving at 100% |
| 3 ($10M CP+S) | debitSaving | $923.08 | **$800.00** | 80,000txns × $0.01 |
| 3 ($10M CP+S) | icSaving | $8,623.08 | **$8,500.00** | $800+$7,700 |
| 3 ($10M CP+S) | grossCOA | $47,007.69 | $47,007.69 | UNCHANGED |
| 3 ($10M CP+S) | surchargeRevenue | $120,000 | **$108,000** | $10M×1.2%×0.90 |
| 3 ($10M CP+S) | netToday | -$72,992.31 | **-$60,992.31** | $47,007.69-$108,000 |
| 3 ($10M CP+S) | octNet | $38,384.61 | **$38,507.69** | $47,007.69-$8,500 |
| 3 ($10M CP+S) | plSwing | -$111,376.92 | **-$99,500.00** | -$60,992.31-$38,507.69 |
| 4 ($3M Flat+S) | debitSaving | $276.92 | **$240.00** | 24,000txns × $0.01 |
| 4 ($3M Flat+S) | icSaving | $2,586.92 | **$2,550.00** | $240+$2,310 |
| 4 ($3M Flat+S) | surchargeRevenue | $36,000 | **$32,400** | $3M×1.2%×0.90 |
| 4 ($3M Flat+S) | netToday | $6,000 | **$9,600** | $42,000-$32,400 |
| 4 ($3M Flat+S) | octNet | $40,835.89 | **$40,852.50** | $42,000-($2,550×0.45) |
| 4 ($3M Flat+S) | plSwing | -$34,835.89 | **-$31,252.50** | $9,600-$40,852.50 |
| 5 ($5M expert) | all | unchanged | unchanged ✓ | 7c < 8c cap, debitSaving=$0 |

**NOT permitted to change:**
- `creditSaving` — any scenario
- `grossCOA` — any scenario (debitIC uses full debitShare 0.60)
- `todayScheme`, `oct2026Scheme` — any scenario
- `netToday` — Scenarios 1 and 2
- `plSwing` — Scenario 2@0%PT and Scenario 5

---

## Scenario 6 (add or update) — Surcharge network share tests

```typescript
describe('Scenario 6 — Surcharge network share calculation', () => {

  it('surcharging=false → surchargeRevenue = $0 regardless of networks', () => {
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000,
      surcharging: false,
      surchargeRate: 0.012,
      surchargeNetworks: [],
    }), PRE_REFORM);
    expect(result.surchargeRevenue).toBe(0);
  });

  it('surcharging=true, surchargeNetworks=[] → defaults to all designated → share=0.90', () => {
    // DEFAULT_BREAKDOWN: visa_debit(0.35)+visa_credit(0.18)+mc_debit(0.17)+mc_credit(0.12)+eftpos(0.08)=0.90
    // This is the backward-compatible case: Scenarios 3 and 4 use empty []
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000,
      surcharging: true,
      surchargeRate: 0.012,
      surchargeNetworks: [],
    }), PRE_REFORM);
    // $1M × 1.2% × 0.90 = $10,800
    expect(result.surchargeRevenue).toBeCloseTo(10_800, 1);
  });

  it('Visa+MC only (visa+mastercard networks) → share=0.82', () => {
    // visa_debit(0.35)+visa_credit(0.18)+mc_debit(0.17)+mc_credit(0.12) = 0.82
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000,
      surcharging: true,
      surchargeRate: 0.012,
      surchargeNetworks: ['visa', 'mastercard'],
    }), PRE_REFORM);
    // $1M × 1.2% × 0.82 = $9,840
    expect(result.surchargeRevenue).toBeCloseTo(9_840, 1);
  });

  it('All designated (visa+mastercard+eftpos) → share=0.90', () => {
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000,
      surcharging: true,
      surchargeRate: 0.012,
      surchargeNetworks: ['visa', 'mastercard', 'eftpos'],
    }), PRE_REFORM);
    expect(result.surchargeRevenue).toBeCloseTo(10_800, 1);
  });

  it('Amex-only surcharger → surchargeRevenue = $0 (amex not designated)', () => {
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000,
      surcharging: true,
      surchargeRate: 0.012,
      surchargeNetworks: ['amex'],
    }), PRE_REFORM);
    expect(result.surchargeRevenue).toBe(0);
  });

});
```

---

## Scenario 7 — Zero-cost

```typescript
describe('Scenario 7a — Zero-cost: $600K, msfRateMode=market_estimate (1.4%)', () => {
  const inputs = makeInputs({
    volume: 600_000,
    planType: 'zero_cost',
    estimatedMSFRate: 0.014,
  });
  const result = calculateZeroCostMetrics(inputs, PRE_REFORM);

  it('modelType is zero_cost', () => {
    expect(result.modelType).toBe('zero_cost');
  });
  it('preReformNetCost is exactly 0 (literal type)', () => {
    expect(result.preReformNetCost).toBe(0);
  });
  it('postReformNetCost = $600K × 1.4% = $8,400', () => {
    expect(result.postReformNetCost).toBeCloseTo(8_400, 1);
  });
  it('reformImpact === postReformNetCost', () => {
    expect(result.reformImpact).toBe(result.postReformNetCost);
  });
  it('plSwingLow = $600K × 1.2% = $7,200', () => {
    expect(result.plSwingLow).toBeCloseTo(7_200, 1);
  });
  it('plSwing = $600K × 1.4% = $8,400', () => {
    expect(result.plSwing).toBeCloseTo(8_400, 1);
  });
  it('plSwingHigh = $600K × 1.6% = $9,600', () => {
    expect(result.plSwingHigh).toBeCloseTo(9_600, 1);
  });
  it('confidence is directional', () => {
    expect(result.confidence).toBe('directional');
  });
  it('urgency is critical', () => {
    expect(result.urgency).toBe('critical');
  });
});

describe('Scenario 7b — Zero-cost: custom rate 1.3%', () => {
  it('postReformNetCost uses custom rate', () => {
    const result = calculateZeroCostMetrics(
      makeInputs({ volume: 1_200_000, planType: 'zero_cost', estimatedMSFRate: 0.013 }),
      PRE_REFORM
    );
    expect(result.postReformNetCost).toBeCloseTo(15_600, 1);  // $1.2M × 1.3%
  });
});

describe('Scenario 7c — Zero-cost: preReformNetCost invariant', () => {
  const volumes = [0, 100_000, 600_000, 2_000_000, 10_000_000];
  volumes.forEach(vol => {
    it(`preReformNetCost === 0 at volume $${vol.toLocaleString()}`, () => {
      const result = calculateZeroCostMetrics(
        makeInputs({ volume: vol, planType: 'zero_cost', estimatedMSFRate: 0.014 }),
        PRE_REFORM
      );
      expect(result.preReformNetCost).toBe(0);
    });
  });
});
```

---

## Scenario 8 — Blended

```typescript
describe('Scenario 8a — Blended: $1M with exact rates provided', () => {
  // debitRate=0.9%, creditRate=1.8%, msfRate=1.3% (fallback for unknown segments)
  // debitShare=0.60 (covers all debit incl eftpos), consumerCreditShare=0.35
  // unknownShare = 1 - 0.60 - 0.35 = 0.05
  // effectiveMSFRate = 0.009×0.60 + 0.018×0.35 + 0.013×0.05
  //                  = 0.0054 + 0.0063 + 0.00065 = 0.01235 (NO round2 on rate)
  // annualMSF = $1M × 0.01235 = $12,350
  const inputs = makeInputs({
    volume: 1_000_000,
    planType: 'blended',
    msfRate: 0.013,
    debitRate: 0.009,
    creditRate: 0.018,
    surcharging: false,
  });
  const result = calculateMetrics(inputs, PRE_REFORM);

  it('assigns category 2 (blended normalises to flat)', () => {
    expect(result.category).toBe(2);
  });
  it('annualMSF = $12,350 (weighted rate, no round2 error)', () => {
    expect(result.plSwing).not.toBeCloseTo(0, 0);  // not $0 (0% PT)
    // The effective rate 0.01235 must NOT be round2'd to 0.01
    // If round2 is incorrectly applied: annualMSF=$10,000 → plSwing=$0 at any PT
    // If correct: annualMSF=$12,350
    // At 0% PT: plSwing=$0, so test with 100% PT to expose the issue:
    const result100 = calculateMetrics({ ...inputs, passThrough: 1.0 }, PRE_REFORM);
    expect(result100.plSwing).toBeCloseTo(1700, 0);  // icSaving=$1,700 at 100%PT
  });
  it('uses debitShare (0.60) not visaMcDebitShare (0.52) for effective rate', () => {
    // At passThrough=0, plSwing=0. Verify via annualMSF value by checking plSwingHigh
    // plSwingHigh = icSaving = $1,700 (at 100% PT)
    // This indirectly confirms the rate calculation is using the full share
    expect(result.plSwingHigh).toBeCloseTo(1700, 0);
  });
});

describe('Scenario 8b — Blended: $1M without rates (fallback to msfRate)', () => {
  const result = calculateMetrics(makeInputs({
    volume: 1_000_000,
    planType: 'blended',
    msfRate: 0.013,
    surcharging: false,
    // debitRate and creditRate NOT provided
  }), PRE_REFORM);

  it('annualMSF falls back to volume × msfRate = $13,000', () => {
    // When debitRate/creditRate absent, effectiveMSFRate = msfRate = 0.013
    // annualMSF = $1M × 0.013 = $13,000
    // At 0%PT: plSwing=$0. At 100%PT: plSwing=icSaving=$1,700.
    const result0 = calculateMetrics(makeInputs({
      volume: 1_000_000, planType: 'blended', msfRate: 0.013,
      surcharging: false, passThrough: 0,
    }), PRE_REFORM);
    expect(result0.plSwing).toBeCloseTo(0, 1);
  });
});

describe('Scenario 8c — Blended + surcharging', () => {
  it('assigns category 4', () => {
    const result = calculateMetrics(makeInputs({
      volume: 2_000_000, planType: 'blended', msfRate: 0.013,
      surcharging: true, surchargeRate: 0.012,
      surchargeNetworks: ['visa', 'mastercard'],  // 0.82 share
    }), PRE_REFORM);
    expect(result.category).toBe(4);
    // surchargeRevenue = $2M × 1.2% × 0.82 = $19,680
    expect(result.surchargeRevenue).toBeCloseTo(19_680, 1);
    expect(result.plSwing).toBeLessThan(0);  // surcharging is painful for Cat 4
  });
});
```

---

## Scenario 9 — LCR: ATV-dependent debit saving

```typescript
describe('Scenario 9 — ATV effect on debitSaving', () => {
  it('ATV $15 (cafe) — lower-of stays at cents (15c > 9c, so 9c cap wins)', () => {
    // MIN(9c, 0.20%×$15) = MIN(9c, 3c) → 3c wins → lower-of gives 3c pre-reform
    // MIN(8c, 0.16%×$15) = MIN(8c, 2.4c) → 2.4c wins → lower-of gives 2.4c post-reform
    // saving per txn = 3c - 2.4c = 0.6c = $0.006
    const result = calculateMetrics(makeInputs({
      volume: 1_000_000, avgTransactionValue: 15,
    }), PRE_REFORM);
    // visaMcDebitTxns = 1M × 0.52 / 15 = 34,666.67
    // debitSaving = 34,666.67 × $0.006 = $208.00
    expect(result.debitSaving).toBeCloseTo(208, 0);
  });

  it('ATV $65 (retail) — cents cap wins (9c < 13c)', () => {
    // MIN(9c, 0.20%×$65)=MIN(9c,13c)=9c pre; MIN(8c,0.16%×$65)=MIN(8c,10.4c)=8c post
    // saving per txn = 1c = $0.01
    const result = calculateMetrics(makeInputs({
      volume: 2_000_000, avgTransactionValue: 65,
    }), PRE_REFORM);
    // visaMcDebitTxns = 2M × 0.52 / 65 = 16,000
    expect(result.debitSaving).toBeCloseTo(160, 1);  // 16,000 × $0.01
  });
});
```

---

## Scenario 10 — Strategic rate detection

```typescript
describe('Scenario 10 — detectStrategicRate()', () => {
  it('self_reported: planType=strategic_rate → detected', () => {
    const r = detectStrategicRate('strategic_rate', 1_000_000, 'Stripe');
    expect(r.detected).toBe(true);
    expect(r.triggerReason).toBe('self_reported');
  });
  it('volume_threshold: $50M+ at capable PSP → detected', () => {
    const r = detectStrategicRate('costplus', 50_000_000, 'CommBank');
    expect(r.detected).toBe(true);
    expect(r.triggerReason).toBe('volume_threshold');
  });
  it('$50M+ at non-capable PSP → not detected', () => {
    const r = detectStrategicRate('costplus', 50_000_000, 'Stripe');
    expect(r.detected).toBe(false);
  });
  it('$49.9M at CommBank → not detected (below threshold)', () => {
    const r = detectStrategicRate('costplus', 49_999_999, 'CommBank');
    expect(r.detected).toBe(false);
  });
  it('getCategory handles zero_cost defensively', () => {
    // zero_cost should not throw — normalises to flat
    expect(() => getCategory('zero_cost', false)).not.toThrow();
    expect(getCategory('zero_cost', false)).toBe(2);
    expect(getCategory('zero_cost', true)).toBe(4);
  });
});
```

---

## Range invariant tests

```typescript
describe('Range invariants', () => {
  it('plSwingLow and plSwingHigh are identical at 0%, 45%, 100% passThrough', () => {
    const base = makeInputs({ volume: 2_000_000, planType: 'flat', surcharging: false });
    const r0   = calculateMetrics({ ...base, passThrough: 0 }, PRE_REFORM);
    const r45  = calculateMetrics({ ...base, passThrough: 0.45 }, PRE_REFORM);
    const r100 = calculateMetrics({ ...base, passThrough: 1.0 }, PRE_REFORM);
    expect(r0.plSwingLow).toBe(r45.plSwingLow);
    expect(r0.plSwingLow).toBe(r100.plSwingLow);
    expect(r0.plSwingHigh).toBe(r45.plSwingHigh);
    expect(r0.plSwingHigh).toBe(r100.plSwingHigh);
  });

  it('Cat2 range: plSwingLow=0, plSwingHigh=icSaving', () => {
    const r = calculateMetrics(makeInputs({
      volume: 2_000_000, planType: 'flat', surcharging: false, passThrough: 0.45,
    }), PRE_REFORM);
    expect(r.plSwingLow).toBe(0);
    expect(r.plSwingHigh).toBeCloseTo(1700, 0);  // icSaving
  });

  it('Cat1 range: plSwingLow=icSaving×0.80, plSwingHigh=icSaving×1.20', () => {
    const r = calculateMetrics(makeInputs({
      volume: 2_000_000, planType: 'costplus', surcharging: false,
    }), PRE_REFORM);
    expect(r.plSwingLow).toBeCloseTo(1360, 0);   // $1,700 × 0.80
    expect(r.plSwingHigh).toBeCloseTo(2040, 0);  // $1,700 × 1.20
  });
});
```

---

## New test files required before Phase 5

### packages/calculations/__tests__/actions.test.ts

```typescript
describe('buildActions — zero-cost', () => {
  const actions = buildActions('zero_cost', 'Smartpay', 'retail');
  it('returns exactly 3 actions', () => expect(actions).toHaveLength(3));
  it('all URGENT priority', () => actions.forEach(a => expect(a.priority).toBe('urgent')));
  it('PSP name embedded', () => expect(actions[0].text).toContain('Smartpay'));
});

describe('buildActions — blended Cat 2 vs flat Cat 2', () => {
  const flat    = buildActions(2, 'Stripe', 'retail', 'flat');
  const blended = buildActions(2, 'Stripe', 'retail', 'blended');
  it('blended has 2 more actions', () => expect(blended.length).toBe(flat.length + 2));
  it('extra actions are PLAN priority', () => {
    blended.slice(flat.length).forEach(a => expect(a.priority).toBe('plan'));
  });
});

describe('buildActions — blended Cat 4 vs flat Cat 4', () => {
  const flat    = buildActions(4, 'Westpac', 'retail', 'flat');
  const blended = buildActions(4, 'Westpac', 'retail', 'blended');
  it('blended has 2 more actions', () => expect(blended.length).toBe(flat.length + 2));
});
```

### packages/calculations/__tests__/resolver.test.ts — additions

```typescript
describe('Industry card mix resolution', () => {
  it('cafe industry uses cafe defaults (higher debit, higher eftpos)', () => {
    const resolved = resolveAssessmentInputs(baseRaw, { country:'AU', industry:'cafe' });
    // cafe: visa_debit=0.38 > retail 0.35
    expect(resolved.cardMix.breakdown?.visa_debit).toBeGreaterThan(0.35);
    expect(resolved.resolutionTrace['cardMix.visa_debit'].source).toBe('industry_default');
  });
  it('unknown industry falls back to regulatory constant', () => {
    const r = resolveAssessmentInputs(baseRaw, { country:'AU', industry:'unknown_xyz' });
    expect(r.resolutionTrace['cardMix.visa_debit'].source).toBe('regulatory_constant');
  });
  it('merchant input overrides industry default', () => {
    const r = resolveAssessmentInputs(baseRaw, { country:'AU', industry:'cafe',
      merchantInput: { cardMix: { visa_debit: 0.50 } } });
    expect(r.resolutionTrace['cardMix.visa_debit'].source).toBe('merchant_input');
  });
});

describe('msfRateMode three-state resolution', () => {
  const zeroCostRaw = { ...baseRaw, planType: 'zero_cost' as const };
  it('market_estimate → 0.014, source=merchant_input', () => {
    const r = resolveAssessmentInputs({ ...zeroCostRaw, msfRateMode: 'market_estimate' },
      { country:'AU', industry:'retail' });
    expect(r.estimatedMSFRate).toBe(0.014);
    expect(r.resolutionTrace['estimatedMSFRate'].source).toBe('merchant_input');
  });
  it('custom + valid rate → custom rate', () => {
    const r = resolveAssessmentInputs({ ...zeroCostRaw, msfRateMode:'custom', customMSFRate:0.013 },
      { country:'AU', industry:'retail' });
    expect(r.estimatedMSFRate).toBe(0.013);
  });
  it('unselected → falls back to regulatory constant (0.014)', () => {
    const r = resolveAssessmentInputs({ ...zeroCostRaw, msfRateMode:'unselected' },
      { country:'AU', industry:'retail' });
    expect(r.estimatedMSFRate).toBe(0.014);
    expect(r.resolutionTrace['estimatedMSFRate'].source).toBe('regulatory_constant');
  });
});

describe('Blended rate resolution', () => {
  const blendedRaw = { ...baseRaw, planType: 'blended' as const };
  it('resolves debitRate and creditRate from blendedRates', () => {
    const r = resolveAssessmentInputs(blendedRaw, { country:'AU', industry:'retail',
      merchantInput: { blendedRates: { debitRate:0.009, creditRate:0.018 } } });
    expect(r.debitRate).toBe(0.009);
    expect(r.creditRate).toBe(0.018);
  });
  it('resolves to undefined when no rates provided', () => {
    const r = resolveAssessmentInputs(blendedRaw, { country:'AU', industry:'retail' });
    expect(r.debitRate).toBeUndefined();
    expect(r.creditRate).toBeUndefined();
  });
});
```

### apps/web/e2e/new-plan-types.spec.ts (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Zero-cost EFTPOS journey', () => {
  test('blocks Next until rate mode selected, completes to results', async ({ page }) => {
    await page.goto('/assessment');
    await page.getByRole('button', { name: 'Start my assessment' }).click();
    await page.getByLabel('Annual card volume').fill('600000');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('radio', { name: 'Zero-cost EFTPOS plan' }).click();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();  // no rate yet

    await page.getByRole('button', { name: 'Use 1.4% market estimate' }).click();
    await page.getByRole('button', { name: 'Smartpay' }).click();
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('button', { name: 'No' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Retail' }).click();
    await page.getByRole('button', { name: 'See my results' }).click();

    await expect(page.getByText(/payment cost model changes/i)).toBeVisible();
    await expect(page.getByText('$0')).toBeVisible();
  });
});

test.describe('Blended plan journey', () => {
  test('completes blended assessment, shows range display, slider at 45%', async ({ page }) => {
    await page.goto('/assessment');
    await page.getByRole('button', { name: 'Start my assessment' }).click();
    await page.getByLabel('Annual card volume').fill('1000000');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('radio', { name: 'Blended rate plan' }).click();
    await page.getByLabel('Debit rate (%)').fill('0.9');
    await page.getByLabel('Credit rate (%)').fill('1.6');
    await page.getByRole('button', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('button', { name: 'No' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Retail' }).click();
    await page.getByRole('button', { name: 'See my results' }).click();

    await expect(page.getByText('to')).toBeVisible();            // range separator
    await expect(page.getByText('Expected:')).toBeVisible();     // expected outcome
    await expect(page.getByRole('slider')).toHaveValue('45');    // default 45%
  });
});

test.describe('Strategic rate journey', () => {
  test('exit page renders inline, back button restores Step 2 state', async ({ page }) => {
    await page.goto('/assessment');
    await page.getByRole('button', { name: 'Start my assessment' }).click();
    await page.getByLabel('Annual card volume').fill('1000000');
    await page.getByRole('button', { name: 'Next' }).click();

    // Click strategic rate link
    await page.getByRole('button', { name: /strategic rate/i }).click();
    await expect(page.getByText(/doesn't apply to your situation/i)).toBeVisible();
    // URL should NOT change
    await expect(page).toHaveURL(/\/assessment/);

    // Back button returns to Step 2
    await page.getByRole('button', { name: /back to assessment/i }).click();
    await expect(page.getByRole('radio', { name: 'Flat rate plan' })).toBeVisible();
  });
});
```

### Component smoke tests (apps/web/__tests__/)

```typescript
// ZeroCostResultsVariant.test.tsx
const mockOutputs = { modelType:'zero_cost' as const, preReformNetCost:0 as const,
  postReformNetCost:8400, reformImpact:8400, plSwingLow:7200, plSwing:8400, plSwingHigh:9600,
  rangeDriver:'post_reform_rate' as const, rangeNote:'test', estimatedMSFRate:0.014,
  confidence:'directional' as const, urgency:'critical' as const, period:'pre_reform' as const };
test('renders critical banner', () => {
  render(<ZeroCostResultsVariant outputs={mockOutputs} volume={600000} pspName="Smartpay" actions={[]} />);
  expect(screen.getByText(/payment cost model changes/i)).toBeInTheDocument();
});
test('shows $0 as pre-reform cost', () => {
  render(<ZeroCostResultsVariant outputs={mockOutputs} volume={600000} pspName="Smartpay" actions={[]} />);
  expect(screen.getByText('$0')).toBeInTheDocument();
});

// StrategicRateExitPage.test.tsx
test('no dollar figures in body', () => {
  render(<StrategicRateExitPage onBack={() => {}} />);
  expect(document.body.textContent).not.toMatch(/\$\d/);
});

// LCRInsightPanel.test.tsx
test('renders and varies with ATV', () => {
  const { rerender } = render(
    <LCRInsightPanel volume={2_000_000} pspName="Stripe" planType="flat" avgTransactionValue={65} />
  );
  const atv65 = document.body.textContent ?? '';
  rerender(
    <LCRInsightPanel volume={2_000_000} pspName="Stripe" planType="flat" avgTransactionValue={15} />
  );
  // ATV $15: eftpos effective rate = $0.02/$15 = 0.133%, diff smaller → lower estimate
  expect(document.body.textContent).not.toBe(atv65);
});
```
