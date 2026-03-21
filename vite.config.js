import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Copy Service Worker to dist after build
const copyServiceWorker = {
  name: 'copy-service-worker',
  writeBundle() {
    const src = resolve(__dirname, 'src/service-worker.js')
    const dest = resolve(__dirname, 'dist/service-worker.js')
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest)
      console.log('Copied service-worker.js to dist/')
    }
  }
}

export default defineConfig({
  base: '/shelf/',  // Change this to match your GitHub repo name (e.g., '/my-repo/')
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
        chunk: './chunk.html'
      }
    }
  },
  publicDir: 'public',
  plugins: [copyServiceWorker]
})
