import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Simple chunking: React packages together, Tone.js separate, everything else in main bundle
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('scheduler') ||
              id.includes('jsx')
            ) {
              return 'react-vendor';
            }
            if (id.includes('tone')) {
              return 'tone-vendor';
            }
          }
        },
      },
    },
  },
});
