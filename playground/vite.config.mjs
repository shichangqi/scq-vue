import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('./', import.meta.url)),
  base: process.env.GITHUB_ACTIONS ? '/scq-vue/' : '/',
  plugins: [vue()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules') && id.includes('highlight.js')) return 'syntax'
          if (id.includes('node_modules') && /markdown-it|linkify-it|uc\.micro|mdurl|entities/.test(id)) return 'markdown'
          if (id.includes('node_modules') && id.includes('date-fns')) return 'dates'
          if (id.includes('node_modules') && /embla-carousel|@tanstack/.test(id)) return 'interaction'
          if (id.includes('/playground/src/docs/reference')) return 'reference'
        },
      },
    },
  },
  resolve: {
    alias: {
      'scq-vue': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api/AI': {
        target: 'http://116.62.202.77:8001',
        changeOrigin: true,
      },
      '/chatos8/go': {
        target: 'https://siomi.aichat83.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chatos8\/go/, '/go'),
      },
    },
  },
})
