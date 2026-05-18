import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.31.217',
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
