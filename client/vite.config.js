import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Expose environment variables to the app
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000/api'),
    __VITE_APP_ENV__: JSON.stringify(process.env.VITE_APP_ENV || 'development'),
  },
  server: {
    port: 5173,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.VITE_APP_ENV === 'production' ? false : true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@mui/material', '@mui/icons-material'],
          'redux': ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
});
