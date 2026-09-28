import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    // Build straight into the repo-root portal/ folder that nginx serves.
    outDir: '../portal',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
