import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { existsSync, readdirSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const components = resolve(root, 'src/components')
const entries = Object.fromEntries(readdirSync(components, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(resolve(components, entry.name, 'index.ts')))
  .map((entry) => [`components/${entry.name}/index`, resolve(components, entry.name, 'index.ts')]))

const componentStyles = {
  name: 'scq-component-styles',
  generateBundle(_options, bundle) {
    for (const entryName of Object.keys(entries)) {
      const componentName = entryName.split('/')[1]
      const styleName = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
      const fileName = `styles/${styleName}.css`
      const styles = new Set()
      const visited = new Set()
      const collectStyles = (chunkName) => {
        if (visited.has(chunkName)) return
        visited.add(chunkName)
        const chunk = bundle[chunkName]
        if (!chunk || chunk.type !== 'chunk') return
        chunk.imports.forEach(collectStyles)
        chunk.viteMetadata?.importedCss?.forEach((style) => styles.add(style))
      }
      collectStyles(`${entryName}.mjs`)
      this.emitFile({
        type: 'asset',
        fileName,
        source: [
          `@import '../../styles/${styleName}.css';`,
          ...[...styles].map((style) => `@import '${posix.relative(posix.dirname(fileName), style)}';`),
          '',
        ].join('\n'),
      })
    }
  },
}

export default defineConfig({
  plugins: [vue(), componentStyles],
  build: {
    emptyOutDir: false,
    cssCodeSplit: true,
    lib: {
      entry: entries,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.mjs`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].mjs',
        assetFileNames: 'components/[name][extname]',
      },
    },
  },
})