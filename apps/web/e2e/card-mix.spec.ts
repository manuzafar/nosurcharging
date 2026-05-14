import { test, expect } from '@playwright/test';

test.describe('Card mix → confidence badge', () => {
  test('entering card mix fields updates confidence', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1
    // Step 1's input is click-to-edit; use the $2M preset chip.
    await page.getByRole('button', { name: '$2M', exact: true }).click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2 — open card mix panel (v2 single-radio-list copy).
    // CardMixInput and ExpertPanel are now nested inside the
    // RefineRatesPanel, which is gated on PSP selection and collapsed
    // by default. Flow order therefore changes: plan → PSP → expand
    // Refine → open the card-mix / expert-panel toggles.
    await page.getByRole('radio', { name: 'IC++ (Interchange Plus)' }).click();
    await page.getByRole('radio', { name: 'Stripe' }).click();

    // Expand the "Refine my rates" container
    await page.getByRole('button', { name: /Refine my rates/i }).click();

    // Open card mix input
    await page.getByText(/know your card mix/i).click();

    // Default confidence badge should show "market averages" (grey/neutral)
    await expect(page.getByText(/will use market averages/i)).toBeVisible();

    // Fill in expert rates to change confidence
    await page.getByText(/payment wizard/i).click();
    const debitInput = page.getByPlaceholder('9');
    await debitInput.fill('8');

    // Confidence should now show "exact rates" (green)
    await expect(page.getByText(/calculated from your exact rates/i)).toBeVisible();
  });
});
