import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * Locate Chrome Canary. The HTML-in-Canvas API is only available in
 * Chrome Canary behind --enable-blink-features=CanvasDrawElement, so we
 * cannot use Playwright's bundled Chromium. macOS-first; extend as needed.
 */
const CANARY_PATHS = [
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  process.env.CHROME_CANARY_PATH,
].filter(Boolean) as string[];

const canaryPath = CANARY_PATHS.find((p) => existsSync(p));

if (!canaryPath) {
  throw new Error(
    'Chrome Canary not found. Install it from https://www.google.com/chrome/canary/ ' +
      'or set CHROME_CANARY_PATH to its executable.',
  );
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chrome-canary',
      use: {
        ...devices['Desktop Chrome'],
        channel: undefined,
        launchOptions: {
          executablePath: canaryPath,
          args: ['--enable-blink-features=CanvasDrawElement'],
        },
      },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
