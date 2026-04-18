import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [
      // Component and hook tests need jsdom for DOM APIs
      ['__tests__/components/**', 'jsdom'],
      ['__tests__/hooks/**', 'jsdom'],
      // Server action tests run in node
      ['__tests__/actions/**', 'node'],
    ],
    setupFiles: ['__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@nosurcharging/calculations': path.resolve(
        __dirname,
        '../../packages/calculations',
      ),
      '@nosurcharging/calculations/*': path.resolve(
        __dirname,
        '../../packages/calculations/*',
      ),
    },
  },
});
