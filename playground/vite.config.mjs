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
  },
  resolve: {
    alias: {
      'scq-vue': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
})
