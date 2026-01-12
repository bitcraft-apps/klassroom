import { tmpdir } from 'node:os';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    // Suppress fontconfig "Unable to revert mtime" warnings from node-canvas
    // by directing font cache to a writable temp directory
    env: {
      FONTCONFIG_CACHE: tmpdir(),
    },
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.test.ts'],
    },
  },
});
