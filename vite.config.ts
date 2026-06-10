/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const shared = fileURLToPath(new URL('./shared', import.meta.url));

export default defineConfig({
  root: 'client',
  publicDir: false,
  resolve: { alias: { '@shared': shared } },
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': { target: 'ws://localhost:3000', ws: true },
    },
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.ts'],
    alias: { '@shared': shared },
  },
});
