import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('hero section renders with CTA', async ({ page }) => {
    await page.goto('/');

    // Hero revision (May 2026, brief v2): consolidated eyebrow pill
    // that displays a dynamic day count until 1 October 2026 — or
    // "The surcharge ban is in effect" thereafter. The earlier
    // "Surcharge ban · 1 October 2026" eyebrow + the separate
    // "days remaining" text element are both gone.
    await expect(
      page.getByText(/(\d+\s+days?\s+until\s+the\s+surcharge\s+ban|The surcharge ban is in effect)/i),
    ).toBeVisible();
    // Single hero CTA. The nav-band CTA was deleted in this revision
    // so the assertion no longer needs to disambiguate.
    await expect(page.getByRole('link', { name: /start my free report/i }).first()).toBeVisible();
    // Reassurance line replaces the deleted three-icon trust row.
    await expect(
      page.getByText('No sign-up, no account. Five minutes.'),
    ).toBeVisible();
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
