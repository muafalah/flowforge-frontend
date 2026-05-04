import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vitest config for INTEGRATION tests only.
 * Runs files matching *.integration.test.* pattern.
 */
export default defineConfig({
  plugins: [
    // @ts-expect-error - vitest bundles a different vite version
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.integration.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude],
  },
})
