import { test, expect } from '@playwright/test';

test.describe('Card mix → confidence badge', () => {
  test('entering card mix fields updates confidence', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start assessment/i }).click();

    // Step 1
    await page.getByRole('textbox').fill('2000000');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — open card mix panel
    await page.getByRole('radio', { name: /list of separate charges/i }).click();

    // Open card mix input
    await page.getByText(/know your card mix/i).click();

    // Default confidence badge should show "RBA averages" (grey/neutral)
    await expect(page.getByText(/will use rba averages/i)).toBeVisible();

    // Fill in expert rates to change confidence
    await page.getByText(/payment wizard/i).click();
    const debitInput = page.getByPlaceholder('9');
    await debitInput.fill('8');

    // Confidence should now show "exact rates" (green)
    await expect(page.getByText(/calculated from your exact rates/i)).toBeVisible();
  });
});
