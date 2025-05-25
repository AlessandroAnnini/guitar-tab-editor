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
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('tone')) return 'tone-vendor';
            if (id.includes('lucide')) return 'icons-vendor';
            return 'vendor';
          }
          if (id.includes('src/audio-utils')) return 'audio';
          if (id.includes('src/utils')) return 'utils';
          if (id.includes('src/components/ui')) return 'ui-components';
          if (id.includes('src/components')) return 'components';
          if (id.includes('src/stores')) return 'stores';
        },
      },
    },
  },
});
