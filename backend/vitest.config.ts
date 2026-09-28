import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Run tests sequentially. Concurrency tests must not fight each other
    // for the same DB rows across files.
    fileParallelism: false,
    testTimeout: 15000,
  },
});