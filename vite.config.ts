/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 45,
        functions: 35,
        branches: 50,
        statements: 45,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'k6/**',
        'docs/**',
        'public/**',
        'src/test/**',
        'src/__tests__/**',
        'src/main.tsx',
        'src/types/**',
        '*.config.js',
        '*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});
