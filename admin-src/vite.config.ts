import { defineConfig } from 'vite';

export default defineConfig({
  base: '/admin/',
  server: {
    proxy: {
      '/admin/api': {
        target: 'http://127.0.0.1:3001',
        rewrite: (path) => path.replace(/^\/admin\/api/, ''),
      },
    },
  },
});
