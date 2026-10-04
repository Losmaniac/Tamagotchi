import { defineConfig } from 'vitest/config';

// Bedtime logic uses the device's local time; pin it so tests are deterministic.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'UTC' },
    coverage: {
      provider: 'v8',
      include: ['src/game/**/*.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
