// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

const PORT = 5188;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests share localStorage state — run serially
  workers: 1,
  reporter: [['list']],
  retries: 0,
  timeout: 20_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  // Two projects so we can verify both Tab S8 portrait and landscape.
  projects: [
    {
      name: 'tablet-portrait',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'tablet-landscape',
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],

  webServer: {
    command: `"C:/Users/JeganGN/.bun/bin/bunx.exe" serve src -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
