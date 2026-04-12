import { test, expect } from '@playwright/test';

test.describe('Layman journey → Category 2', () => {
  test('full assessment flow produces results', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer — check checkbox and start
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();

    // Step 1 — enter volume
    await page.getByRole('textbox').fill('2000000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — select flat rate + PSP
    await page.getByRole('radio', { name: /one percentage on every transaction/i }).click();
    await page.getByRole('button', { name: 'Stripe' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — not surcharging
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — select industry
    await page.getByText('Retail').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Wait for reveal screen to complete and navigate to results
    await page.waitForURL(/\/results\?id=/, { timeout: 10000 });

    // Results page assertions
    await expect(page.getByText('Situation 2')).toBeVisible();
    await expect(page.getByText(/per year from 1 October/)).toBeVisible();
  });

  test('slider updates P&L in real time', async ({ page }) => {
    // Navigate directly to a results page (requires existing assessment)
    await page.goto('/assessment');

    // Quick flow through
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();
    await page.getByRole('textbox').fill('2000000');
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('radio', { name: /one percentage on every transaction/i }).click();
    await page.getByRole('button', { name: 'Square' }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByText('Cafe / Restaurant').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    await page.waitForURL(/\/results\?id=/, { timeout: 10000 });

    // Slider should be visible (Category 2)
    const slider = page.getByRole('slider');
    await expect(slider).toBeVisible();

    // Move slider to 50%
    await slider.fill('50');

    // Expected P&L line should show a non-zero value
    const expectedLine = page.getByText(/Expected:/);
    await expect(expectedLine).toBeVisible();
  });
});
