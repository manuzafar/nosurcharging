# Testing Strategy
## nosurcharging.com.au

**Version:** 1.0 | **April 2026**

---

## 1. Philosophy

**The calculation engine is the product. It must be provably correct.**

A wrong number in a financial tool destroys trust permanently. A merchant who reprices their menu based on an incorrect P&L output, then discovers the error when October comes, will tell other merchants. The test suite exists primarily to prevent this.

**Tests run in the pipeline before any deployment.** No merge to staging without tests passing. No merge to main without tests passing. This is non-negotiable.

**Test behaviour, not implementation.** Tests should survive refactors. If rewriting a calculation function from scratch makes all tests pass, the refactor is safe. If tests are tightly coupled to internal implementation details, they provide false assurance.

---

## 2. Testing Pyramid

```
                    ┌───────────┐
                    │    E2E    │  Playwright
                    │  20–30    │  Full user journeys
                    │  tests    │  in real browsers
                  ├─────────────┤
                 │  Integration  │  Vitest + MSW
                │   40–60 tests  │  Server actions
               │                  │  API routes
             ├────────────────────┤
            │        Unit          │  Vitest
           │      100+ tests       │  Calculation engine
          │   (most critical)      │  Pure functions
         └──────────────────────────┘
```

**Unit tests are the foundation.** The calculation engine has more unit tests than anything else in the codebase. This is correct and intentional.

**E2E tests cover critical journeys only.** Not every interaction — the journeys that, if broken, mean a merchant gets a wrong answer or cannot complete an assessment.

---

## 3. Framework Choices

### Vitest (unit + integration)

**Why Vitest not Jest:** The PRD documented Jest as the test runner. Vitest is the replacement. API is 100% compatible — no test code changes if migrating from Jest. Vitest is 10–20x faster for TypeScript projects, has native ESM support (required by Next.js 14), and integrates cleanly with Turborepo's build cache.

```typescript
// packages/calculations/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        // Calculation engine must have near-complete coverage
        'packages/calculations/**': {
          lines: 95,
          functions: 95,
          branches: 90,
        },
      },
    },
  },
});
```

### React Testing Library (component tests)

Tests what users experience, not internal component state. Queries by accessible role, label, and text — not CSS selectors or component internals.

```bash
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

### MSW — Mock Service Worker (API mocking)

Intercepts network requests at the service worker level for integration tests. More reliable than mocking `fetch` directly. Used to mock Supabase calls in server action tests.

```bash
npm install -D msw
```

### Playwright (E2E)

Real browser automation. Tests run in Chromium, Firefox, and WebKit. Mobile viewport testing built in.

```bash
npx playwright install
```

---

## 4. Unit Tests — Calculation Engine

**This test suite is a hard gate in the build sequence. No UI code is written until it passes.**

### Directory structure

```
packages/calculations/
├── calculations.ts
├── categories.ts
├── actions.ts
├── constants/
│   └── au.ts
└── __tests__/
    ├── calculations.test.ts   ← primary — highest coverage
    ├── categories.test.ts
    ├── actions.test.ts
    └── constants.test.ts
```

### Required test cases — calculations.test.ts

Every test case must match the verified reference scenarios in `docs/product/calculation-verification.md`.

```typescript
// packages/calculations/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateMetrics } from '../calculations';
import { AU_INTERCHANGE, AU_CARD_MIX_DEFAULTS } from '../constants/au';

describe('calculateMetrics — Category 1 (cost-plus, not surcharging)', () => {
  it('returns positive P&L swing for standard $2M flat rate merchant', () => {
    const result = calculateMetrics({
      volume: 2_000_000,
      planType: 'costplus',
      surcharging: false,
      surchargeRate: 0,
      passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.category).toBe(1);
    expect(result.plSwing).toBeGreaterThan(0);
    expect(result.icSaving).toBeGreaterThan(0);
    expect(result.octNet).toBeLessThan(result.netToday);
  });

  it('IC saving is sum of debit and credit savings', () => {
    const result = calculateMetrics({
      volume: 1_000_000,
      planType: 'costplus',
      surcharging: false,
      surchargeRate: 0,
      passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    const expectedDebitTxns = (1_000_000 * 0.60) / 65;
    const expectedDebitSaving = expectedDebitTxns * 0.01;
    const expectedCreditSaving = 1_000_000 * 0.35 * 0.0022;
    const expectedICSaving = expectedDebitSaving + expectedCreditSaving;

    expect(result.icSaving).toBeCloseTo(expectedICSaving, 2);
  });
});

describe('calculateMetrics — Category 2 (flat rate, not surcharging)', () => {
  it('at 0% pass-through, P&L swing is zero', () => {
    const result = calculateMetrics({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: false,
      surchargeRate: 0,
      passThrough: 0,  // PSP keeps saving
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.category).toBe(2);
    expect(result.plSwing).toBe(0);
  });

  it('at 100% pass-through, P&L swing equals total IC saving', () => {
    const result = calculateMetrics({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: false,
      surchargeRate: 0,
      passThrough: 1.0,  // Full saving reaches merchant
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.plSwing).toBeCloseTo(result.icSaving, 2);
  });

  it('at 45% pass-through, P&L swing is 45% of IC saving', () => {
    const result = calculateMetrics({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: false,
      surchargeRate: 0,
      passThrough: 0.45,
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.plSwing).toBeCloseTo(result.icSaving * 0.45, 2);
  });
});

describe('calculateMetrics — Category 3 (cost-plus, surcharging)', () => {
  it('P&L swing is negative when surcharge revenue exceeds IC saving', () => {
    const result = calculateMetrics({
      volume: 10_000_000,
      planType: 'costplus',
      surcharging: true,
      surchargeRate: 0.012,  // 1.2% surcharge
      passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.category).toBe(3);
    expect(result.plSwing).toBeLessThan(0);
    // Surcharge revenue always exceeds IC saving for realistic surcharge rates
    expect(Math.abs(result.plSwing)).toBeGreaterThan(result.icSaving);
  });
});

describe('calculateMetrics — Category 4 (flat rate, surcharging)', () => {
  it('worst case: both surcharge loss and no pass-through', () => {
    const result = calculateMetrics({
      volume: 3_000_000,
      planType: 'flat',
      surcharging: true,
      surchargeRate: 0.012,
      passThrough: 0,  // PSP keeps saving
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: null,
    }, AU_INTERCHANGE);

    expect(result.category).toBe(4);
    expect(result.plSwing).toBeLessThan(0);
  });

  it('P&L swing improves with higher pass-through', () => {
    const at0 = calculateMetrics({
      volume: 3_000_000, planType: 'flat', surcharging: true,
      surchargeRate: 0.012, passThrough: 0, cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    const at100 = calculateMetrics({
      volume: 3_000_000, planType: 'flat', surcharging: true,
      surchargeRate: 0.012, passThrough: 1.0, cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    expect(at100.plSwing).toBeGreaterThan(at0.plSwing);
  });
});

describe('calculateMetrics — Expert mode', () => {
  it('uses expert rates when provided instead of RBA averages', () => {
    const defaultResult = calculateMetrics({
      volume: 1_000_000, planType: 'costplus', surcharging: false,
      surchargeRate: 0, passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    const expertResult = calculateMetrics({
      volume: 1_000_000, planType: 'costplus', surcharging: false,
      surchargeRate: 0, passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS,
      expertRates: { debitCents: 0.05, creditPct: 0.30, marginPct: 0.08 }, // below-average rates
    }, AU_INTERCHANGE);

    // Merchant with better rates has lower today cost but also lower saving
    expect(expertResult.netToday).toBeLessThan(defaultResult.netToday);
  });
});

describe('calculateMetrics — Edge cases', () => {
  it('never returns NaN for any input', () => {
    const result = calculateMetrics({
      volume: 0, planType: 'flat', surcharging: false,
      surchargeRate: 0, passThrough: 0,
      cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    Object.values(result).forEach(val => {
      if (typeof val === 'number') expect(isNaN(val)).toBe(false);
    });
  });

  it('never returns Infinity', () => {
    const result = calculateMetrics({
      volume: 1_000_000_000, // $1B edge case
      planType: 'flat', surcharging: true,
      surchargeRate: 0.05, passThrough: 1.0,
      cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    Object.values(result).forEach(val => {
      if (typeof val === 'number') expect(isFinite(val)).toBe(true);
    });
  });

  it('scheme fees bar values are exactly equal for both periods', () => {
    const result = calculateMetrics({
      volume: 2_000_000, planType: 'flat', surcharging: false,
      surchargeRate: 0, passThrough: 0.5,
      cardMix: AU_CARD_MIX_DEFAULTS, expertRates: null,
    }, AU_INTERCHANGE);

    // This enforces the critical chart design requirement:
    // scheme fees must be EXACTLY equal in both chart columns
    expect(result.todayScheme).toBe(result.oct2026Scheme);
  });
});
```

### Required test cases — categories.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { getCategory } from '../categories';

describe('getCategory', () => {
  it('cost-plus + not surcharging = Category 1', () => {
    expect(getCategory('costplus', false)).toBe(1);
  });
  it('flat + not surcharging = Category 2', () => {
    expect(getCategory('flat', false)).toBe(2);
  });
  it('cost-plus + surcharging = Category 3', () => {
    expect(getCategory('costplus', true)).toBe(3);
  });
  it('flat + surcharging = Category 4', () => {
    expect(getCategory('flat', true)).toBe(4);
  });
});
```

### Required test cases — resolver.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveAssessmentInputs } from '../rules/resolver';

const baseRaw = {
  volume: 2_000_000, planType: 'flat' as const, msfRate: 0.014,
  surcharging: false, surchargeRate: 0, surchargeNetworks: [],
  industry: 'retail', psp: 'Stripe', passThrough: 0, country: 'AU',
};

describe('resolveAssessmentInputs — source priority', () => {
  it('merchant input beats env var for card mix', () => {
    process.env.CALC_CARD_MIX_VISA_DEBIT = '0.40';
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60 } },
    });
    expect(result.resolutionTrace['cardMix.visa_debit'].source).toBe('merchant_input');
    expect(result.resolutionTrace['cardMix.visa_debit'].value).toBe(0.60);
  });

  it('env var beats regulatory constant', () => {
    process.env.CALC_CARD_MIX_VISA_DEBIT = '0.40';
    const result = resolveAssessmentInputs(baseRaw, { country: 'AU', industry: 'retail' });
    expect(result.resolutionTrace['cardMix.visa_debit'].source).toBe('env_var');
  });

  it('falls back to regulatory constant when no other source', () => {
    delete process.env.CALC_CARD_MIX_VISA_DEBIT;
    const result = resolveAssessmentInputs(baseRaw, { country: 'AU', industry: 'retail' });
    expect(result.resolutionTrace['cardMix.visa_debit'].source).toBe('regulatory_constant');
  });
});

describe('resolveAssessmentInputs — normalisation', () => {
  it('normalises partial merchant input to sum to 1.0', () => {
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60, amex: 0.05 } },
    });
    const { breakdown } = result.cardMix;
    const total = Object.values(breakdown!).reduce((s, v) => s + v, 0);
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
  });

  it('handles merchant input that sums to > 100%', () => {
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.70, visa_credit: 0.40 } }, // 110%
    });
    const total = Object.values(result.cardMix.breakdown!).reduce((s, v) => s + v, 0);
    expect(Math.abs(total - 1.0)).toBeLessThan(0.001);
  });

  it('produces zero breakdown values (not undefined) for all schemes', () => {
    const result = resolveAssessmentInputs(baseRaw, { country: 'AU', industry: 'retail' });
    const { breakdown } = result.cardMix;
    expect(breakdown).toBeDefined();
    Object.values(breakdown!).forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(isNaN(v)).toBe(false);
    });
  });
});

describe('resolveAssessmentInputs — confidence', () => {
  it('low confidence when all fields use defaults', () => {
    const result = resolveAssessmentInputs(baseRaw, { country: 'AU', industry: 'retail' });
    expect(result.confidence).toBe('low');
  });

  it('high confidence when majority of fields from merchant input', () => {
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: {
        cardMix: {
          visa_debit: 0.35, visa_credit: 0.18, mastercard_debit: 0.17,
          mastercard_credit: 0.12, eftpos: 0.08,
        },
        avgTransactionValue: 45,
        expertRates: { debitCents: 8, creditPct: 0.40 },
      },
    });
    expect(result.confidence).toBe('high');
  });

  it('medium confidence when some fields from merchant input', () => {
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.60 } },
    });
    expect(result.confidence).toBe('medium');
  });
});

describe('resolveAssessmentInputs — resolution trace', () => {
  it('trace contains source label for every rule', () => {
    const result = resolveAssessmentInputs(baseRaw, { country: 'AU', industry: 'retail' });
    expect(result.resolutionTrace['cardMix.visa_debit'].label).toBe('RBA average');
    expect(result.resolutionTrace['cardMix.visa_debit'].value).toBeGreaterThan(0);
  });

  it('merchant input trace shows Your input label', () => {
    const result = resolveAssessmentInputs(baseRaw, {
      country: 'AU', industry: 'retail',
      merchantInput: { cardMix: { visa_debit: 0.55 } },
    });
    expect(result.resolutionTrace['cardMix.visa_debit'].label).toBe('Your input');
  });
});
```

### Required test cases — security.test.ts

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { hashIP } from '../lib/security';

describe('hashIP', () => {
  beforeEach(() => {
    process.env.IP_HASH_SECRET = 'test-secret-for-unit-tests-only';
  });

  it('produces consistent output for same input', () => {
    expect(hashIP('1.2.3.4')).toBe(hashIP('1.2.3.4'));
  });

  it('produces different output for different IPs', () => {
    expect(hashIP('1.2.3.4')).not.toBe(hashIP('1.2.3.5'));
  });

  it('produces different output with different secrets (rainbow table resistance)', () => {
    const hash1 = hashIP('1.2.3.4');
    process.env.IP_HASH_SECRET = 'different-secret';
    const hash2 = hashIP('1.2.3.4');
    expect(hash1).not.toBe(hash2);
  });

  it('throws if IP_HASH_SECRET is not set', () => {
    delete process.env.IP_HASH_SECRET;
    expect(() => hashIP('1.2.3.4')).toThrow('IP_HASH_SECRET environment variable not set');
  });

  it('never returns the input IP', () => {
    const ip = '1.2.3.4';
    expect(hashIP(ip)).not.toContain(ip);
  });
});
```

---

## 5. Component Tests

```typescript
// apps/web/__tests__/components/PlanTypeCards.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanTypeCards } from '@/components/assessment/PlanTypeCards';

describe('PlanTypeCards', () => {
  it('renders both card options', () => {
    render(<PlanTypeCards selected={null} onSelect={() => {}} />);
    expect(screen.getByText('One flat rate')).toBeInTheDocument();
    expect(screen.getByText('Multiple line items')).toBeInTheDocument();
  });

  it('marks flat rate card as selected when flat is passed', () => {
    render(<PlanTypeCards selected="flat" onSelect={() => {}} />);
    expect(screen.getByRole('radio', { name: /one flat rate/i })).toBeChecked();
  });

  it('calls onSelect with flat when flat rate card is clicked', async () => {
    const onSelect = vi.fn();
    render(<PlanTypeCards selected={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('One flat rate'));
    expect(onSelect).toHaveBeenCalledWith('flat');
  });

  it('expert panel is hidden by default', () => {
    render(<PlanTypeCards selected={null} onSelect={() => {}} />);
    expect(screen.queryByLabelText('Debit (cents per txn)')).not.toBeInTheDocument();
  });

  it('expert panel appears when toggle link is clicked', async () => {
    render(<PlanTypeCards selected={null} onSelect={() => {}} />);
    await userEvent.click(screen.getByText(/payment wizard/i));
    expect(screen.getByLabelText('Debit (cents per txn)')).toBeInTheDocument();
  });
});
```

```typescript
// apps/web/__tests__/components/PassThroughSlider.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassThroughSlider } from '@/components/results/PassThroughSlider';

describe('PassThroughSlider', () => {
  it('displays $0 saving at 0% pass-through', () => {
    render(<PassThroughSlider icSaving={10000} onPassThroughChange={() => {}} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('calls onPassThroughChange when slider moves', async () => {
    const onChange = vi.fn();
    render(<PassThroughSlider icSaving={10000} onPassThroughChange={onChange} />);
    const slider = screen.getByRole('slider');
    // Simulate moving to 50%
    await userEvent.type(slider, '50');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows 90% non-switching note', () => {
    render(<PassThroughSlider icSaving={10000} onPassThroughChange={() => {}} />);
    expect(screen.getByText(/90% of Australian merchants/i)).toBeInTheDocument();
  });
});
```

---

## 6. Integration Tests

Integration tests verify server actions end-to-end with a real (test) Supabase instance or mocked service layer.

```typescript
// apps/web/__tests__/actions/submitAssessment.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitAssessment } from '@/actions/submitAssessment';

// Mock Supabase for integration tests
vi.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: 'test-uuid' }, error: null }),
    }),
  },
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(() => ({ value: 'test-session-uuid' })),
  })),
}));

describe('submitAssessment server action', () => {
  it('assigns Category 4 for flat + surcharging inputs', async () => {
    const result = await submitAssessment({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: true,
      surchargeRate: 1.2,
      industry: 'hospitality',
      psp: 'Stripe',
      expertMode: false,
    });

    expect(result.category).toBe(4);
  });

  it('returns a negative P&L swing for Category 4', async () => {
    const result = await submitAssessment({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: true,
      surchargeRate: 1.2,
      industry: 'hospitality',
      psp: 'Stripe',
      expertMode: false,
    });

    expect(result.outputs.plSwing).toBeLessThan(0);
  });

  it('throws if session cookie is not present', async () => {
    vi.mocked(require('next/headers').cookies)
      .mockReturnValueOnce({ get: () => null });

    await expect(submitAssessment({
      volume: 2_000_000,
      planType: 'flat',
      surcharging: false,
      surchargeRate: 0,
      industry: 'retail',
      psp: 'Square',
      expertMode: false,
    })).rejects.toThrow('No session found');
  });
});
```

---

## 7. End-to-End Tests (Playwright)

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['github']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },

    // Mobile — critical for this product
    { name: 'mobile-chrome',  use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari',  use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test: Complete assessment as a layman (Category 2)

```typescript
// e2e/assessment-layman.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Layman assessment journey — Category 2', () => {
  test('completes full assessment and reaches results', async ({ page }) => {
    await page.goto('/');

    // Start assessment
    await page.click('text=Start free assessment');
    await expect(page).toHaveURL(/assessment/);

    // Disclaimer checkbox
    await page.check('[data-testid="disclaimer-checkbox"]');
    await page.click('text=Continue');

    // Step 1: Volume
    await page.fill('[data-testid="volume-input"]', '2000000');
    await page.click('text=Next');

    // Step 2: Plan type — select flat rate card
    await page.click('[data-testid="plan-card-flat"]');
    await page.click('[data-testid="psp-pill-stripe"]');
    await page.click('text=Next');

    // Step 3: Not surcharging
    await page.click('[data-testid="yn-no"]');
    await page.click('text=Next');

    // Step 4: Industry
    await page.click('[data-testid="industry-hospitality"]');
    await page.click('text=See my results');

    // Wait for reveal screen then results
    await expect(page.locator('[data-testid="reveal-screen"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-verdict"]')).toBeVisible({ timeout: 5000 });

    // Category 2 verdict
    await expect(page.locator('[data-testid="category-badge"]')).toContainText('Category 2');

    // P&L swing is positive (saving available)
    const swingText = await page.locator('[data-testid="pl-swing"]').textContent();
    expect(swingText).toContain('+');
  });

  test('slider updates P&L swing in real time', async ({ page }) => {
    await page.goto('/results?mock=category2'); // Seeded results page for testing

    const slider = page.locator('[data-testid="passthrough-slider"]');
    const saving = page.locator('[data-testid="passthrough-saving"]');

    // At 0% — no saving
    await expect(saving).toContainText('$0');

    // Move slider to 100%
    await slider.fill('100');
    const savingAt100 = await saving.textContent();
    expect(savingAt100).not.toBe('$0');
    expect(savingAt100).toContain('+');
  });
});
```

### E2E Test: Payment wizard path (Category 1)

```typescript
// e2e/assessment-wizard.spec.ts
import { test, expect } from '@playwright/test';

test('wizard completes assessment with expert rates', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Start free assessment');
  await page.check('[data-testid="disclaimer-checkbox"]');
  await page.click('text=Continue');

  // Step 1
  await page.fill('[data-testid="volume-input"]', '5000000');
  await page.click('text=Next');

  // Step 2 — select cost-plus, open expert panel
  await page.click('[data-testid="plan-card-costplus"]');
  await page.click('text=Payment wizard');

  // Expert fields
  await page.fill('[data-testid="expert-debit"]', '7');
  await page.fill('[data-testid="expert-credit"]', '0.35');
  await page.fill('[data-testid="expert-margin"]', '0.08');

  // Confidence badge should show high confidence
  await expect(page.locator('[data-testid="confidence-badge"]'))
    .toContainText('Calculated from your exact rates');

  await page.click('[data-testid="psp-pill-commbank"]');
  await page.click('text=Next');

  // Step 3 — not surcharging
  await page.click('[data-testid="yn-no"]');
  await page.click('text=Next');

  // Step 4
  await page.click('[data-testid="industry-retail"]');
  await page.click('text=See my results');

  await expect(page.locator('[data-testid="results-verdict"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="category-badge"]')).toContainText('Category 1');
});
```

### E2E Test: Amex carve-out

```typescript
// e2e/amex-carveout.spec.ts
import { test, expect } from '@playwright/test';

test('Amex-only surcharger sees carve-out note', async ({ page }) => {
  await page.goto('/');
  // Navigate to step 3 via assessment
  // ... steps 1 and 2 ...

  await page.click('[data-testid="yn-yes"]');

  // Check ONLY Amex
  await page.check('[data-testid="network-amex"]');
  // Do NOT check Visa/eftpos

  await expect(page.locator('[data-testid="amex-carveout-note"]')).toBeVisible();
  await expect(page.locator('[data-testid="amex-carveout-note"]'))
    .toContainText("The October ban doesn't cover Amex");
});

test('Amex carve-out note hides when Visa is also checked', async ({ page }) => {
  // ... navigate to step 3 with Yes ...
  await page.check('[data-testid="network-amex"]');
  await expect(page.locator('[data-testid="amex-carveout-note"]')).toBeVisible();

  await page.check('[data-testid="network-visa"]');
  await expect(page.locator('[data-testid="amex-carveout-note"]')).not.toBeVisible();
});
```

### E2E Test: Mobile viewport

```typescript
// e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('assessment completes on mobile viewport', async ({ page }) => {
  await page.goto('/');

  // Verify plan cards are single column on mobile
  const planGrid = page.locator('[data-testid="plan-grid"]');
  const gridStyle = await planGrid.evaluate(el =>
    window.getComputedStyle(el).gridTemplateColumns
  );
  // Single column = one value
  expect(gridStyle.split(' ').length).toBe(1);

  // Complete full assessment
  // ... (same as layman test above)

  // Verify results display correctly on mobile
  const metricRow = page.locator('[data-testid="metric-row"]');
  const metricStyle = await metricRow.evaluate(el =>
    window.getComputedStyle(el).gridTemplateColumns
  );
  expect(metricStyle.split(' ').length).toBe(1); // Single column on mobile
});
```

### E2E Test: Scheme fees chart invariant

```typescript
// e2e/chart-integrity.spec.ts
import { test, expect } from '@playwright/test';

test('scheme fees bar is same height in both chart periods', async ({ page }) => {
  // Navigate to seeded results page
  await page.goto('/results?mock=category2');

  // This test enforces the critical design requirement:
  // scheme fees bars must be EXACTLY equal height
  const todayScheme = await page
    .locator('[data-testid="chart-bar-today-scheme"]')
    .evaluate(el => el.getBoundingClientRect().height);

  const octScheme = await page
    .locator('[data-testid="chart-bar-oct-scheme"]')
    .evaluate(el => el.getBoundingClientRect().height);

  expect(Math.abs(todayScheme - octScheme)).toBeLessThan(1); // Within 1px
});
```

---

## 8. Test Data and Fixtures

```typescript
// e2e/fixtures/assessments.ts
export const ASSESSMENT_FIXTURES = {
  category1: {
    volume: 2_000_000,
    planType: 'costplus' as const,
    surcharging: false,
    surchargeRate: 0,
    industry: 'retail',
    psp: 'Stripe',
    expectedCategory: 1,
    expectedPositivePLSwing: true,
  },
  category2: {
    volume: 2_000_000,
    planType: 'flat' as const,
    surcharging: false,
    surchargeRate: 0,
    industry: 'hospitality',
    psp: 'Square',
    expectedCategory: 2,
    expectedPositivePLSwing: true,
  },
  category3: {
    volume: 10_000_000,
    planType: 'costplus' as const,
    surcharging: true,
    surchargeRate: 1.2,
    industry: 'retail',
    psp: 'Tyro',
    expectedCategory: 3,
    expectedPositivePLSwing: false,
  },
  category4: {
    volume: 3_000_000,
    planType: 'flat' as const,
    surcharging: true,
    surchargeRate: 1.2,
    industry: 'cafe',
    psp: 'CommBank',
    expectedCategory: 4,
    expectedPositivePLSwing: false,
  },
};
```

---

## 9. Coverage Requirements

| Package / Area | Lines | Functions | Branches |
|---|---|---|---|
| packages/calculations | 95% | 95% | 90% |
| apps/web/actions | 80% | 85% | 75% |
| packages/calculations/rules | 90% | 90% | 85% |
| apps/web/lib | 85% | 90% | 80% |
| apps/web/components | 70% | 75% | 65% |

The calculation engine has the highest coverage requirement. It is the most critical code in the product.

---

## 10. Test Organisation in Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "**/*.test.ts", "**/*.spec.ts"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    }
  }
}
```

**Turborepo caches test results.** If the calculation engine files have not changed, `turbo test` skips the unit tests and uses the cached result. This keeps CI fast.

---

*Testing Strategy v1.0 · nosurcharging.com.au · April 2026*
