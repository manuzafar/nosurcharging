import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/RBA Surcharge Ban/)).toBeVisible();
    await expect(page.getByRole('link', { name: /generate my free report/i }).first()).toBeVisible();
    // Proof row items
    await expect(page.getByText('No account required').first()).toBeVisible();
    await expect(page.getByText('No Stripe or Square affiliation').first()).toBeVisible();
  });

  test('preview section shows four situations', async ({ page }) => {
    await page.goto('/');

    // Situation 1 card should be visible in the 2x2 grid
    await expect(page.getByText('Situation 1').first()).toBeVisible();

    // Situation 3 card should also be visible (static grid, not tabs)
    await expect(page.getByText('Situation 3').first()).toBeVisible();
    await expect(page.getByText(/surcharge revenue disappears/i)).toBeVisible();
  });

  test('features section renders four questions', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Four questions. Your report.')).toBeVisible();
    await expect(page.getByText(/How much do you process/)).toBeVisible();
    await expect(page.getByText(/one rate, or a breakdown/)).toBeVisible();
    await expect(page.getByText(/add a surcharge/)).toBeVisible();
    await expect(page.getByText(/What industry are you in/)).toBeVisible();
  });

  test('privacy policy link works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /privacy policy/i }).click();
    await page.waitForURL('/privacy');

    await expect(page.getByText('What we collect')).toBeVisible();
  });

  test('health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.commit).toBeDefined();
  });
});
