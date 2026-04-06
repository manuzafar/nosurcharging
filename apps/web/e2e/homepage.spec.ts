import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/RBA banned surcharges/)).toBeVisible();
    await expect(page.getByRole('link', { name: /start free assessment/i })).toBeVisible();
    await expect(page.getByText(/no account required/i)).toBeVisible();
    await expect(page.getByText(/no psp affiliation/i)).toBeVisible();
  });

  test('preview section rotates categories', async ({ page }) => {
    await page.goto('/');

    // Category 1 tab should be visible
    await expect(page.getByText('Category 1 — Winner')).toBeVisible();

    // Click Category 3 tab
    await page.getByText('Category 3 — Reprice').click();

    // Category 3 verdict should appear
    await expect(page.getByText(/surcharge revenue disappears/)).toBeVisible();
  });

  test('features section renders 3 items', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('How it works')).toBeVisible();
    await expect(page.getByText('Answer four questions')).toBeVisible();
    await expect(page.getByText('See your P&L impact')).toBeVisible();
    await expect(page.getByText('Get your action plan')).toBeVisible();
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
  });
});
