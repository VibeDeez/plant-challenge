import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    viewport: { width: 375, height: 812 },
    browserName: "chromium",
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  },

  projects: [
    {
      name: "Mobile Chrome",
    },
  ],

  webServer: {
    command: "HOST=127.0.0.1 PORT=3000 E2E_TEST=true npm run dev",
    url: "http://localhost:3000/auth",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
