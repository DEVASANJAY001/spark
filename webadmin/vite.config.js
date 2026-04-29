import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/expo-api': {
        target: 'https://exp.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/expo-api/, '')
      }
    }
  }
})
