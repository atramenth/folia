import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed as a GitHub project page (https://atramenth.github.io/folia/).
// The relative base keeps every asset and page image working under any
// repository name, and navigation uses the URL hash, so deep links such as
// #/p/812 need no 404.html redirect on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
})
