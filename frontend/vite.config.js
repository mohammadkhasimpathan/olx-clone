import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // Enable source maps in production for debugging
    // This allows ErrorBoundary to show real file names and line numbers
    sourcemap: true,
  },
})
