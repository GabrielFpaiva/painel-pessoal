import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },

  projects: [
    {
      // Mobile primeiro: 390px é o alvo de projeto, não um caso de borda.
      name: "mobile",
      use: { ...devices["iPhone 12"], viewport: { width: 390, height: 844 } },
      testIgnore: /\.desktop\.spec\.ts$/,
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
