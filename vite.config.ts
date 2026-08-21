import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const beOrigin = env.VITE_SOCKET_URL || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: beOrigin,
          changeOrigin: true,
        },
        '/uploads': {
          target: beOrigin,
          changeOrigin: true,
        },
        '/socket.io': {
          target: beOrigin,
          ws: true,
        },
      },
    },
  };
});
