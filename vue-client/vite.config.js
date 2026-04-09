import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 开发环境使用 localhost，生产环境使用 .env.production 中的配置
const DEV_SERVER_HOST = 'localhost'
const DEV_SERVER_PORT = 8080

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@moonlight': resolve(__dirname, '../moonlight-web-stream-file')
    }
  },
  server: {
    port: 3000,
    fs: {
      // 允许 Vite dev server 服务根目录以外的文件（Worker 文件在上层目录）
      allow: ['..']
    },
    proxy: {
      '/api/host/stream': {
        target: `ws://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`,
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`,
        changeOrigin: true,
        // 排除 WebSocket 升级请求，避免与上面的 ws 规则冲突
        bypass(req) {
          if (req.headers.upgrade === 'websocket') return false
        }
      },
      '/host/stream': {
        target: `ws://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`,
        ws: true
      }
    }
  },
  worker: {
    format: 'es'
  }
})
