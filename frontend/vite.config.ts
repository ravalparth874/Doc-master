import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  // These packages ship CommonJS builds. Node cannot read named exports from an
  // external CommonJS module, so the SSR bundle includes them instead.
  ssr: {
    noExternal: ['react-helmet-async', 'react-i18next', 'i18next'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    // Manual chunks only apply to the browser bundle: in the SSR build the
    // dependencies stay external and Rollup refuses to group them.
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            // Split the rarely changing libraries into their own long-lived chunks.
            manualChunks: {
              react: ['react', 'react-dom', 'react-router-dom'],
              i18n: ['i18next', 'react-i18next'],
              seo: ['react-helmet-async'],
            },
          },
        },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
}))
