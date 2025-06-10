import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const GITHUB_PAGE_BASE = 'https://bakuhu-shokusei.github.io/ocr-web/'

export default defineConfig(({ mode }) => {
  return {
    plugins: [vue()],
    base: mode === 'development' ? '' : GITHUB_PAGE_BASE,
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/assets': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
