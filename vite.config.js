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
          // vue 全家桶与 element-plus 互相依赖，拆开成多个 chunk 会形成循环引用，
          // 运行时触发 TDZ（Cannot access 'xxx' before initialization）；
          // 合并进同一个 vendor chunk，由 rollup 统一排序初始化顺序。
          if (!id.includes('node_modules')) return
          if (/[\\/]vue[\\/]|vue-router|pinia|element-plus|@element-plus|@vue-flow|@vue[\\/]/.test(id)) {
            return 'vendor'
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
