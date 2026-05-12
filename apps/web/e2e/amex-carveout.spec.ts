import { test, expect } from '@playwright/test';

test.describe('Amex carve-out — regulatory note (May 2026 always-on)', () => {
  // The v1 conditional "October ban doesn't cover Amex…" success note
  // was removed in #58 (results credibility M2). The replacement is an
  // always-on regulatory info note rendered inside Step 3's conditional
  // container whenever the merchant selects "Yes, I surcharge". The
  // carve-out content moved into the always-on copy itself — the
  // network mix no longer toggles visibility.
  //
  // This spec covers the new behaviour: regulatory note visible on
  // any Yes-network combination; collapses with the container when
  // the merchant flips to No.
  test('regulatory note appears whenever surcharging Yes is selected (any network mix)', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1
    await page.getByRole('button', { name: '$1M', exact: true }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — flat rate + Stripe
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — Yes surcharging. Yes pre-selects all four networks.
    await page.getByRole('button', { name: /Yes.*surcharge/i }).click();

    // Regulatory note is visible immediately (default = all networks
    // surcharged).
    await expect(
      page.getByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).toBeVisible();

    // Now uncheck Visa/eftpos/BNPL to leave only Amex — the note must
    // STAY visible. The v2 note is always-on; it does not toggle on
    // network mix the way the v1 conditional note did.
    await page.getByRole('checkbox', { name: /visa/i }).uncheck();
    await page.getByRole('checkbox', { name: /eftpos/i }).uncheck();
    await page.getByRole('checkbox', { name: /bnpl/i }).uncheck();

    await expect(
      page.getByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).toBeVisible();

    // Flip to No — the conditional container (and the note inside
    // it) collapses. This is the only legitimate way the note
    // disappears in the v2 always-on regime.
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await expect(
      page.getByText(/surcharging Visa, Mastercard, and eftpos becomes illegal/i),
    ).not.toBeVisible();
  });
});
