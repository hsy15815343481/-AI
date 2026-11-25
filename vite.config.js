import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 静态托管在子路径（/app/<app_id>/）下发布，资源必须用相对路径；
  // 若用默认 '/' 会生成根绝对路径 /assets/...，在子路径下丢失应用前缀导致 404。
  base: './',
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    // 把 JS/CSS 全部内联进单个 index.html，避免托管环境下独立大 chunk 被中止/404
    viteSingleFile()
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
        // 动态导入也内联进同一文件，产物为单 HTML，不保留外链 chunk
        inlineDynamicImports: true
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
