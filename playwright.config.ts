import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: "retain-on-failure",
    locale: "es-VE",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PUERTO}`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
