import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Extension .e2e.ts : Vitest (qui cherche *.test.ts / *.spec.ts) ne les lance pas
  testMatch: /.*\.e2e\.ts/,
  // Un seul navigateur à la fois : les tests partagent les comptes de démo
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Version compilée (comme en production) : rapide et stable, contrairement au serveur de dev
  webServer: {
    command: "pnpm build && pnpm preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});