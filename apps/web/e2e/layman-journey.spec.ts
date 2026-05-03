import { test, expect } from '@playwright/test';

test.describe('Layman journey → Category 2', () => {
  test('full assessment flow produces results', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer — check checkbox and start
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1 — enter volume
    await page.getByRole('textbox').fill('2000000');
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
    await page.getByRole('button', { name: /skip and view now/i }).click();

    // Wait for reveal screen to complete and navigate to results
    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });

    // Results page assertions — scoped to overview to avoid strict mode violation
    // (TopBar also renders "Situation N")
    const overview = page.locator('#overview');
    await expect(overview.getByText('Situation 2')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/per year from 1 October/)).toBeVisible();
  });

  test('slider updates P&L in real time', async ({ page }) => {
    // Navigate directly to a results page (requires existing assessment)
    await page.goto('/assessment');

    // Quick flow through
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();
    await page.getByRole('textbox').fill('2000000');
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Square' }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByText('Cafe / Restaurant').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Skip the email gate
    await page.getByRole('button', { name: /skip and view now/i }).click();

    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });

    // Wait for results content to load before interacting
    await expect(page.locator('#overview').getByText(/Situation \d/)).toBeVisible({ timeout: 10000 });

    // Slider is directly visible in RefineSection (DepthToggle removed in two-column redesign)
    const slider = page.getByRole('slider');
    await expect(slider).toBeVisible();

    // Move slider to 50%
    await slider.fill('50');
  });
});
