import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run server',
      url: 'http://localhost:5001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      command: 'npm run admin',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
  ],
});

