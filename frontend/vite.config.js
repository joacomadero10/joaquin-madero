import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, el dev server de Vite proxea /api y /socket.io al backend
// (puerto 5000) para no lidiar con CORS mientras se codea. En produccion,
// el build estatico lo sirve Nginx, que hace el mismo proxy (ver
// backend/README.md para el bloque de Nginx de referencia).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
