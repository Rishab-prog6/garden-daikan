import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 部署到子路径时改 base，例如 GitHub Pages: base: '/daikan-garden/'
export default defineConfig({
  plugins: [react()],
  base: './',
})
