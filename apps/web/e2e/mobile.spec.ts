import { test, expect } from '@playwright/test';

test.describe('Mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Hero visible
    await expect(page.getByText(/RBA Surcharge Ban/)).toBeVisible();

    // CTA button visible
    await expect(page.getByRole('link', { name: /generate my free report/i }).first()).toBeVisible();
  });

  test('assessment flow works on mobile', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1
    await page.getByRole('textbox').fill('500000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — plan cards should be single column
    await page.getByRole('radio', { name: /a single rate on every transaction/i }).click();
    await page.getByRole('radio', { name: 'Tyro' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — industry grid should be 2 columns on mobile
    await page.getByText('Online store').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Should navigate to results
    await page.waitForURL(/\/results\?id=/, { timeout: 10000 });
    await expect(page.getByText('Situation 2')).toBeVisible();
  });
});
