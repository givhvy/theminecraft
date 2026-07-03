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
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': { target: 'ws://localhost:3001', ws: true },
    },
  },
  test: {
    environment: 'node',
    include: ['../tests/**/*.test.ts'],
    alias: { '@shared': shared },
  },
});
