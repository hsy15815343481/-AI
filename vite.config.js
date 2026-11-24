import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]vue[\\/]|vue-router|pinia/.test(id)) return 'vendor-vue'
            if (/@vue-flow/.test(id)) return 'vendor-flow'
            if (/element-plus|@element-plus/.test(id)) return 'vendor-element'
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 本地开发时把 /api 代理到后端；MVP 后端未接入前可指向占位地址
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
})
