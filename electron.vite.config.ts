import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        // macOS-only optional dependency. Keep it out of the bundle so Linux CI
        // can build without installing it and electron-builder can package it.
        external: ['fsevents'],
      },
    },
  },
  preload: {},
  renderer: {
    plugins: [react()],
  },
});
