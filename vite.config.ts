import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend.crymadx.io',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: 'wss://backend.crymadx.io',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
