import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;

/**
 * E2E coverage for the professional paths: the independent-work offer and
 * contact links work, the résumé and employment profile remain reachable, and
 * cross-page navigation into the eight worlds does not 404. Runs against a
 * real `next start` production server — same
 * shape as scripts/a11y/test.mjs's server lifecycle.
 *
 * Uses the `chrome` channel (system Google Chrome) rather than Playwright's
 * bundled Chromium: it matches the common visitor browser and avoids
 * downloading a second Chromium when Chrome is already present in CI images
 * and on this machine.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  // Hard ceiling for the whole run, teardown included: a wedged worker or
  // browser server must fail loudly (and release the webServer) instead of
  // hanging CI or a local loop forever after every test already passed.
  globalTimeout: 20 * 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    // The terrain camera and journey progress animate in production. CI
    // should assert their settled state instead of waiting on software-rendered
    // motion, and this matches the accessibility audit's reduced-motion run.
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "phone",
      testMatch: /worlds-responsive\.spec\.ts|find-overlay\.spec\.ts/,
      use: { ...devices["iPhone 13"], browserName: "chromium", channel: "chrome" },
    },
    {
      name: "tablet",
      testMatch: /worlds-responsive\.spec\.ts/,
      use: { ...devices["iPad Pro 11"], browserName: "chromium", channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
