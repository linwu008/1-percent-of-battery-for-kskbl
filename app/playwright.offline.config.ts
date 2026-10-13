import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: /offline\.spec\.ts|desktop\.spec\.ts/,
  workers: 1,
  timeout: 60000,
  use: {
    channel: "msedge",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  outputDir: "test-results/offline",
});
