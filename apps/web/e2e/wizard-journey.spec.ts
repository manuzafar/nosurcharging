import { test, expect } from '@playwright/test';

test.describe('Wizard journey → Category 1', () => {
  test('expert rates produce Category 1 results', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();

    // Step 1 — $5M volume
    await page.getByRole('textbox').fill('5000000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — cost-plus + expert rates
    await page.getByRole('radio', { name: /cost-plus/i }).click();

    // Open expert panel
    await page.getByText(/payment wizard/i).click();

    // Fill expert rates
    const debitInput = page.getByPlaceholder('9');
    await debitInput.fill('8');

    await page.getByRole('button', { name: 'ANZ' }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3 — not surcharging
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — hospitality
    await page.getByText('Hospitality group').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    await page.waitForURL(/\/results\?id=/, { timeout: 10000 });

    // Category 1 — costs fall automatically
    await expect(page.getByText('Situation 1')).toBeVisible();

    // Slider should NOT be visible (Category 1)
    await expect(page.getByRole('slider')).not.toBeVisible();
  });
});
