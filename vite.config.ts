import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to repository name for GitHub Pages
  // Change 'kedro-builder-pt' to your actual repository name
  base: '/kedro-builder-pt/',
})
