import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api is proxied to the Express server so the auth cookie stays same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
