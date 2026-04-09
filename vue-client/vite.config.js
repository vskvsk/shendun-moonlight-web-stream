import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 开发环境使用 localhost，生产环境使用 .env.production 中的配置
const DEV_SERVER_HOST = 'localhost'
const DEV_SERVER_PORT = 8080

function moonlightDistShims() {
  const distConfigImporter = resolve(__dirname, '../dist/config_.js').replaceAll('\\', '/')
  const openH264ImporterSuffix = '/dist/stream/video/openh264_decoder_pipe.js'
  return {
    name: 'moonlight-dist-shims',
    resolveId(source, importer) {
      if (!importer) return null
      const normalizedImporter = importer.replaceAll('\\', '/')
      if (source === './config.js' && normalizedImporter === distConfigImporter) {
        return '\0moonlight-config-js'
      }
      if (source === '../../libopenh264/decoder.js' && normalizedImporter.endsWith(openH264ImporterSuffix)) {
        return '\0moonlight-openh264-decoder-missing'
      }
      return null
    },
    load(id) {
      if (id === '\0moonlight-config-js') {
        return 'export default { path_prefix: \"\" }'
      }
      if (id === '\0moonlight-openh264-decoder-missing') {
        return 'throw new Error(\"openh264 decoder module is not present in this repo checkout\")'
      }
      return null
    }
  }
}

export default defineConfig({
  plugins: [vue(), moonlightDistShims()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@moonlight': resolve(__dirname, '../dist')
    }
  },
  server: {
    port: 3000,
    fs: {
      // 允许 Vite dev server 服务根目录以外的文件（Worker 文件在上层目录）
      allow: ['..']
    },
    proxy: {
      '/config.js': {
        target: `http://${DEV_SERVER_HOST}:${DEV_SERVER_PORT}`,
        changeOrigin: true
      },
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
