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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle node_modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor'; // Keep all React modules together
            }
            if (id.includes('tone')) {
              return 'tone-vendor';
            }
            if (id.includes('lucide')) {
              return 'icons';
            }
            return 'vendor'; // Other dependencies
          }

          // Handle app code
          if (id.includes('src/audio-utils')) {
            return 'app-audio';
          }
          if (id.includes('src/components')) {
            return 'app-components';
          }
          if (id.includes('src/stores')) {
            return 'app-stores';
          }
          if (id.includes('src/utils')) {
            return 'app-utils';
          }
        },
      },
    },
  },
});
