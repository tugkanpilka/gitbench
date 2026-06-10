import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment is node so application and parser tests run without Electron or a DOM.
    // Renderer component tests opt into jsdom via a `@vitest-environment jsdom` pragma.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
