import { test, expect } from '@playwright/test';

test.describe('Amex carve-out', () => {
  test('Amex only → note appears; add Visa → note disappears', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();

    // Step 1
    await page.getByRole('textbox').fill('1000000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2
    await page.getByRole('radio', { name: /flat rate/i }).click();
    await page.getByRole('button', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — Yes surcharging
    await page.getByRole('button', { name: /Yes.*surcharge/i }).click();

    // Check only Amex
    await page.getByRole('checkbox', { name: /amex/i }).check();

    // Carve-out note should appear
    await expect(page.getByText(/october ban doesn.*cover amex/i)).toBeVisible();

    // Check Visa & Mastercard
    await page.getByRole('checkbox', { name: /visa/i }).check();

    // Carve-out note should disappear
    await expect(page.getByText(/october ban doesn.*cover amex/i)).not.toBeVisible();
  });
});
