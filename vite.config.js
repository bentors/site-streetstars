import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    headers: mode === 'development' ? {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; connect-src 'self' http://localhost:3001 https://*.firebaseio.com https://*.googleapis.com https://api.cloudinary.com https://www.google-analytics.com https://viacep.com.br; font-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'"
    } : {}
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
          framer: ['framer-motion'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore/lite', 'firebase/firestore'],
          analytics: ['react-ga4']
        }
      }
    }
  }
}))