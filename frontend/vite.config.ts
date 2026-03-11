import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/products': 'http://localhost:3000',
      '/cart': 'http://localhost:3000',
      '/checkout': 'http://localhost:3000',
    }
  }
})
