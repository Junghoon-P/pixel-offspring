import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";
process.env.APP_ORIGIN = "http://127.0.0.1:5174";
process.env.PIXEL_LOCAL_DB = "true";
process.env.E2E_DB_TOKEN ??= randomBytes(32).toString("hex");
export default defineConfig({
  webServer: {
    command: "pnpm start --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 60000,
  },
  testDir: "tests/e2e",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
