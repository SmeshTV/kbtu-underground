import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
