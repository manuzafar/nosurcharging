import { test, expect } from '@playwright/test';

test.describe('Amex carve-out', () => {
  test('Amex only → note appears; add Visa → note disappears', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1
    await page.getByRole('textbox').fill('1000000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — Yes surcharging.
    // The Yes button now pre-selects all four networks (visa, eftpos,
    // amex, bnpl) — UX win for the common case where merchants surcharge
    // everything. To exercise the Amex-only carve-out we have to uncheck
    // the non-exempt networks first so only the exempt ones remain.
    await page.getByRole('button', { name: /Yes.*surcharge/i }).click();
    await page.getByRole('checkbox', { name: /visa/i }).uncheck();
    await page.getByRole('checkbox', { name: /eftpos/i }).uncheck();
    await page.getByRole('checkbox', { name: /bnpl/i }).uncheck();

    // Amex remains checked from the prefill — confirm by re-asserting.
    await page.getByRole('checkbox', { name: /amex/i }).check();

    // Carve-out note should appear
    await expect(page.getByText(/october ban doesn.*cover amex/i)).toBeVisible();

    // Check Visa & Mastercard
    await page.getByRole('checkbox', { name: /visa/i }).check();

    // Carve-out note should disappear
    await expect(page.getByText(/october ban doesn.*cover amex/i)).not.toBeVisible();
  });
});
