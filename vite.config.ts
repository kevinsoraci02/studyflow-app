
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Define env prefix for client-side access
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    strictPort: true,
  },
});
