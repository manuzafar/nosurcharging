import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'calculations.ts',
        'categories.ts',
        'periods.ts',
        'actions.ts',
        'types.ts',
        'constants/**/*.ts',
        'rules/**/*.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
      },
    },
  },
});
