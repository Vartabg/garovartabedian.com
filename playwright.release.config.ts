import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// The release browser runner owns Chrome. Workers disconnect after each
// project without waiting for a local browser process to exit.
export default defineConfig({
  ...base,
  // Keep failure evidence outside disposable release checkouts when requested.
  outputDir: process.env.RELEASE_TEST_OUTPUT_DIR ?? "test-results",
  globalTimeout: 20 * 60 * 1000,
  use: {
    ...base.use,
    connectOptions: { wsEndpoint: process.env.RELEASE_BROWSER_ENDPOINT ?? "" },
  },
});
