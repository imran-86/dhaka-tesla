import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    testTimeout: 15000,

    // Windows-friendly pool: threads instead of forked processes.
    // Forked workers intermittently crash with exit code 0xC0000409
    // (stack buffer overrun) on Windows when running many Prisma calls.
    pool: 'threads',
  },
});