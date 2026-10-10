import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Derive origin from VITE_API_URL/vite_SOCKET_URL to keep /api & /socket.io on same host in prod.
  // Supports both relative (/api) and absolute (https://api.example.com/api).
  const getOrigin = (url?: string) => {
    if (!url) return null;
    try {
      return new URL(url, 'http://localhost:3000').origin;
    } catch {
      return null;
    }
  };
  const beOrigin = getOrigin(env.VITE_API_URL) || getOrigin(env.VITE_SOCKET_URL) || 'http://localhost:3000';

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
