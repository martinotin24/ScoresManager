import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://scores.martinviolin.com:3000', // ✅ Cambiado de localhost a tu IP
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://scores.martinviolin.com:3000', // ✅ Cambiado de localhost a tu IP
        changeOrigin: true,
        secure: false,
      }
    }
  }
})