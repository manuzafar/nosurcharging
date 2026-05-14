import { test, expect } from '@playwright/test';

test.describe('Wizard journey → Category 1', () => {
  test('expert rates produce Category 1 results', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1 — $5M volume
    // Step 1's input is click-to-edit; the closest preset chip is the
    // cleanest path for a Playwright flow. $5M chip = exact match.
    await page.getByRole('button', { name: '$5M', exact: true }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — cost-plus + expert rates (v2 single-radio-list copy).
    // ExpertPanel is now nested inside the RefineRatesPanel, which is
    // gated on PSP selection and collapsed by default. Flow order
    // therefore changes: plan → PSP → expand Refine → expand Payment
    // wizard → fill rate.
    await page.getByRole('radio', { name: 'IC++ (Interchange Plus)' }).click();
    await page.getByRole('radio', { name: 'ANZ Worldline' }).click();

    // Expand the "Refine my rates" container
    await page.getByRole('button', { name: /Refine my rates/i }).click();

    // Open expert panel inside Refine
    await page.getByText(/payment wizard/i).click();

    // Fill expert rates
    const debitInput = page.getByPlaceholder('9');
    await debitInput.fill('8');

    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3 — not surcharging
    await page.getByRole('button', { name: /No.*customers/i }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4 — hospitality
    await page.getByText('Hospitality group').click();
    await page.getByRole('button', { name: /see my results/i }).click();

    // Skip the email gate
    await page.getByRole('button', { name: /view my results without insights/i }).click();

    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });

    // Category 1 — costs fall automatically (scoped to <main> to avoid
    // strict-mode duplicate from the TopBar pill).
    await expect(page.locator('main').getByText('Situation 1')).toBeVisible({ timeout: 10000 });

    // Slider should NOT be visible (Category 1)
    await expect(page.getByRole('slider')).not.toBeVisible();
  });
});
