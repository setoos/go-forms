import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Force HTTP for local development to avoid mixed content issues
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