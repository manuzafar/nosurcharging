import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const isRemote = !!process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  timeout: isCI ? 30000 : 15000,
  globalTimeout: isCI ? 300_000 : undefined, // 5-minute hard ceiling in CI
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // CI: only Chromium (saves ~1.5GB install + runtime).
  // Local: test across browsers and mobile viewports.
  projects: isCI
    ? [{ name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } }]
    : [
        { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
        { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'Pixel 5', use: { ...devices['Pixel 5'] } },
        { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
      ],
  // When PLAYWRIGHT_BASE_URL is set (CI against staging), no local server needed.
  // When running locally, start the dev server automatically.
  webServer: isRemote
    ? undefined
    : {
        command: 'npx next dev -p 3000',
        port: 3000,
        reuseExistingServer: true,
      },
});
