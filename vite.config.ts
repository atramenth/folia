import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * GitHub Pages answers an unknown path such as /folia/p/812 with its 404.html. Making that file a copy of
 * index.html lets the app start on any address and read the page from the path itself, so links need no "#".
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// Deployed as a GitHub project page (https://atramenth.github.io/folia/). Page links are plain paths such as
// /folia/p/812, so assets need an absolute base. Set VITE_BASE to serve from somewhere else, for example VITE_BASE=/ .
export default defineConfig({
  plugins: [react(), spaFallback()],
  base: process.env.VITE_BASE ?? '/folia/',
})
