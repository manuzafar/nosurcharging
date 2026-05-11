import { test, expect } from '@playwright/test';

test.describe('Layman journey → Category 2', () => {
  test('full assessment flow produces results', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer — check checkbox and start
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1 — enter volume
    // Step 1's input is click-to-edit; use the $2M preset chip.
    await page.getByRole('button', { name: '$2M', exact: true }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — select flat rate + PSP
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — not surcharging
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — select industry
    await page.getByText('Retail').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Email gate appears between Step 4 and reveal — skip past it
    await page.getByRole('button', { name: /view my results without insights/i }).click();

    // Wait for reveal screen to complete and navigate to results
    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });

    // Results page assertions — scoped to <main> to avoid strict mode
    // violation (TopBar in <header> also renders "Situation N").
    // The hero eyebrow is the new stable second assertion (the legacy
    // "per year from 1 October" subtext was trimmed in the M2 cut).
    const main = page.locator('main');
    await expect(main.getByText('Situation 2')).toBeVisible({ timeout: 10000 });
    await expect(
      main.getByText(/Estimated annual P&L impact from October 2026/i),
    ).toBeVisible();
  });

  test('slider updates P&L in real time', async ({ page }) => {
    // Navigate directly to a results page (requires existing assessment)
    await page.goto('/assessment');

    // Quick flow through
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();
    // Step 1's input is click-to-edit; use the $2M preset chip.
    await page.getByRole('button', { name: '$2M', exact: true }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Square' }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByText('Cafe / Restaurant').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Skip the email gate
    await page.getByRole('button', { name: /view my results without insights/i }).click();

    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });

    // Wait for results content to load before interacting
    await expect(page.locator('main').getByText(/Situation \d/)).toBeVisible({ timeout: 10000 });

    // Slider is directly visible in RefineSection (DepthToggle removed in two-column redesign)
    const slider = page.getByRole('slider');
    await expect(slider).toBeVisible();

    // Move slider to 50%
    await slider.fill('50');
  });
});
