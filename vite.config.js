import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the app from /theswingset/; Firebase Hosting and local
// dev serve from the root. The Pages workflow sets GITHUB_PAGES=1.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/theswingset/' : '/',
  plugins: [react(), tailwindcss()],
})
