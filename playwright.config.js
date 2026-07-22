import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.spec.js',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true
  },
  webServer: {
    command: 'npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: true
  }
});
