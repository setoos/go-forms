import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: "dist",
  },
  base: "/",
  server: {
    // Use HTTP instead of HTTPS for local development
    https: false,
    // Ensure proper CORS headers
    proxy: {
      '/.supabase': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        secure: false,
      }
    }
  }
});