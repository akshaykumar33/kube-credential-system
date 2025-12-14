import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { jsxToolDevServer } from "@jsx-tool/jsx-tool/vite";

export default defineConfig({
  plugins: [react(), jsxToolDevServer()],
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})