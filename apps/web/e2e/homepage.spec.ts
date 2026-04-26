import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/RBA Surcharge Ban/)).toBeVisible();
    await expect(page.getByRole('link', { name: /get my free report/i }).first()).toBeVisible();
    // Proof row items (post-Apr 2026 redesign — chip-style claims)
    await expect(page.getByText('No account required').first()).toBeVisible();
    await expect(page.getByText('Independent — no PSP affiliation').first()).toBeVisible();
  });

  test('preview scrollytelling section renders', async ({ page }) => {
    await page.goto('/');

    // The "What you'll receive" eyebrow + report mock replaced the old
    // four-situation grid in Apr 2026.
    await expect(page.getByText(/What you.?ll receive/).first()).toBeVisible();
    await expect(page.getByText(/A complete reform report/)).toBeVisible();
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

    // Scope to the heading role — the same phrase appears as a substring
    // inside the body of section 1 ("…explains what information we collect…")
    // which trips Playwright's strict-mode check on the loose getByText.
    await expect(
      page.getByRole('heading', { name: 'What information we collect' }),
    ).toBeVisible();
  });

  test('health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.commit).toBeDefined();
  });
});
