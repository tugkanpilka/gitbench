import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment is node so application and parser tests run without Electron or a DOM.
    // Renderer component tests opt into jsdom via a `@vitest-environment jsdom` pragma.
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.types.ts', '**/*.test.*', '**/src/test/**', '**/env.d.ts'],
      // Anti-regression floor, set below current actual (~95% lines / 89% branches)
      // with margin so it catches real drops without flaking. Ratchet up over time.
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
    // `npm test` (vitest run) still executes both projects; run one alone with
    // `npx vitest run --project unit` or `npx vitest run --project integration`.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.ts'],
        },
      },
    ],
  },
});
