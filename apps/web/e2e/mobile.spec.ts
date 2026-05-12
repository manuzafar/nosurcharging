import { test, expect } from '@playwright/test';

test.describe('Mobile 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('homepage renders correctly on mobile', async ({ page }) => {
    await page.goto('/');

    // Hero eyebrow (May 2026 hero revision): consolidated pill that
    // flips between "{N} days until the surcharge ban" and
    // "The surcharge ban is in effect" automatically.
    await expect(
      page.getByText(/(\d+\s+days?\s+until\s+the\s+surcharge\s+ban|The surcharge ban is in effect)/i),
    ).toBeVisible();

    // Sole hero CTA — the nav CTA was deleted in the revision so the
    // assertion no longer needs disambiguation.
    await expect(page.getByRole('link', { name: /start my free report/i }).first()).toBeVisible();
  });

  test('assessment flow works on mobile', async ({ page }) => {
    await page.goto('/assessment');

    // Disclaimer
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /start my assessment/i }).click();

    // Step 1
    // Step 1's input is click-to-edit; use the $500K preset chip.
    await page.getByRole('button', { name: '$500K', exact: true }).click();
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

    // Skip the email gate — paper-aesthetic redesign relabelled the skip
    // link to "View my results without insights →" (May 2026).
    await page.getByRole('button', { name: /view my results without insights/i }).click();

    // Should navigate to results (scoped to <main> to avoid TopBar duplicate)
    await page.waitForURL(/\/results\?id=/, { timeout: 15000 });
    await expect(page.locator('main').getByText('Situation 2')).toBeVisible({ timeout: 10000 });
  });
});
