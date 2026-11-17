import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          'vendor-charts': ['recharts'],
          'vendor-forms': ['react-hook-form'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://vprotech-task-management-system1.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://vprotech-task-management-system1.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
