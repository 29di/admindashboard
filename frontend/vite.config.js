import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy standard REST API calls to the Express server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Socket.io WebSocket connections to the Express server
      '/socket.io': {
        target: 'ws://localhost:5000',
        ws: true,
      },
    },
  },
});
