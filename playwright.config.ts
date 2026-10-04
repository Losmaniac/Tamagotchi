import { defineConfig, devices } from '@playwright/test';

// In sandboxes with a preinstalled Chromium, point PW_CHROMIUM_PATH at it instead of downloading.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/Tamagotchi/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/Tamagotchi/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
