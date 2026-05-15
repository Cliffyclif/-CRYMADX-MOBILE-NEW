import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Split heavy vendor libs into their own long-cached chunks so the
    // entry chunk stays small and a deploy doesn't re-download everything.
    // Route screens are already code-split via React.lazy in App.tsx.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react-vendor'
          if (id.includes('@tanstack')) return 'query-vendor'
          if (id.includes('framer-motion')) return 'motion-vendor'
          if (id.includes('lightweight-charts')) return 'chart-vendor'
          if (id.includes('i18next')) return 'i18n-vendor'
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark') || id.includes('mdast')) return 'markdown-vendor'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
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
