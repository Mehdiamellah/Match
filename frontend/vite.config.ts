import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le proxy évite les problèmes de CORS : le front appelle /api/... et Vite relaie vers le backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3000', rewrite: (p) => p.replace(/^\/api/, '') } },
  },
});
