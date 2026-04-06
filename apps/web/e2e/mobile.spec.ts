import { test, expect } from '@playwright/test';

test.describe('Mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Hero visible
    await expect(page.getByText(/RBA banned surcharges/)).toBeVisible();

    // CTA button visible
    await expect(page.getByRole('link', { name: /start free assessment/i })).toBeVisible();

    // Nav "Start assessment" button visible
    await expect(page.getByRole('link', { name: /start assessment/i }).first()).toBeVisible();
  });

  test('assessment flow works on mobile', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();

    // Step 1
    await page.getByRole('textbox').fill('500000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — plan cards should be single column
    await page.getByRole('radio', { name: /flat rate/i }).click();
    await page.getByRole('button', { name: 'Tyro' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3
    await page.getByText('No').click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — industry grid should be 2 columns on mobile
    await page.getByText('Online store').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Should navigate to results
    await page.waitForURL(/\/results\?id=/, { timeout: 10000 });
    await expect(page.getByText('Category 2')).toBeVisible();
  });
});
