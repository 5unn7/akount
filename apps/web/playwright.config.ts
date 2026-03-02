import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E test configuration for Akount
 *
 * Auth: @clerk/testing (global-setup.ts fetches token, auth.setup.ts signs in)
 * Servers: Auto-starts both Next.js (3000) and Fastify API (4000)
 */
export default defineConfig({
  testDir: './e2e',
  /* Ignore fixtures directory — not test files */
  testIgnore: ['**/fixtures/**'],
  /* Fetch Clerk testing token before any project runs */
  globalSetup: require.resolve('./e2e/global-setup'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',
  /* 60s per test — financial flows can be slow */
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  /* Shared settings for all the projects below */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  /* Configure projects: auth setup (sign-in) + test (chromium) */
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, 'playwright/.clerk/user.json'),
      },
      dependencies: ['setup'],
    },
  ],

  /* Start both web and API servers before tests */
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: path.join(__dirname, '../api'),
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
