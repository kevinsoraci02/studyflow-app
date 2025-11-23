
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react', '@supabase/supabase-js', '@google/genai'],
        },
      },
    },
  },
  // Define env prefix for client-side access
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    strictPort: true,
  },
});
