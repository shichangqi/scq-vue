import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Shared runtime dependencies must not pull lazy documentation back into the entry graph.
const SHARED_RUNTIME_MODULES = ['vite/preload-helper', 'vite/modulepreload-polyfill', 'commonjsHelpers']
const VUE_FRAMEWORK_MODULE = /\/node_modules\/(?:@vue\/|vue\/|vue-router\/)/

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
          if (SHARED_RUNTIME_MODULES.some((module) => id.includes(module))) return 'runtime'
          if (VUE_FRAMEWORK_MODULE.test(id)) return 'framework'
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
