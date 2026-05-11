import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');

    // Post-May 2026 hero rework: eyebrow drops the "RBA " prefix and
    // matches the dark countdown band's terminology.
    await expect(page.getByText(/Surcharge ban · 1 October 2026/i)).toBeVisible();
    // Primary hero CTA copy: "Start my free report →". Nav CTA still
    // uses the older "Get my free report →" wording, so scope to the
    // hero copy explicitly.
    await expect(page.getByRole('link', { name: /start my free report/i }).first()).toBeVisible();
    // Trust row — shortened "Independent" label (was "Independent —
    // no PSP affiliation"), plus "No account required" still present.
    await expect(page.getByText('No account required').first()).toBeVisible();
    await expect(page.getByText('Independent').first()).toBeVisible();
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

    // M3 homepage redesign: eyebrow shifts from "Four questions. Your report."
    // to the mono dot-separated form alongside a new section headline.
    await expect(page.getByText('Four questions · your report')).toBeVisible();
    await expect(page.getByText(/No statement in front of you/)).toBeVisible();
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
