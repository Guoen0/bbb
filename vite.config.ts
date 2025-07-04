import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: ['@openai/agents-realtime'],
  },
  resolve: {
    alias: {
      '@openai/agents-realtime': './src/utils/agents-realtime-polyfill.js'
    }
  },
  define: {
    global: 'globalThis'
  }
}) 