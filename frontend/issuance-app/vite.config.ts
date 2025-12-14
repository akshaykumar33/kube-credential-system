import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { jsxToolDevServer } from "@jsx-tool/jsx-tool/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jsxToolDevServer()],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})