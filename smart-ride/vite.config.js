
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react', 
      babel: {
        plugins: ['@emotion/babel-plugin'], 
      },
    }),
  ],
  server: {
    port: 3001, 
    open: true, 
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
    ], 
  },
  build: {
    chunkSizeWarningLimit: 1600, 
  },
});