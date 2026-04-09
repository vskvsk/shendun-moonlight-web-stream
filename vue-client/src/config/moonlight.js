// Moonlight Web 配置
// 根据你的后端服务地址修改以下配置

// 从环境变量获取 API 基础地址（生产环境使用 .env.production 中的配置）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const MOONLIGHT_CONFIG = {
  // API 基础地址
  apiBaseUrl: '',
  
  // 默认流设置
  defaultSettings: {
    sidebarEdge: 'left',
    bitrate: 20000,        // 码率 (kbps)
    packetSize: 2048,
    fps: 60,
    videoFrameQueueSize: 3,
    videoSize: 'custom',   // 可选: '720p', '1080p', '1440p', '4k', 'native', 'custom'
    videoSizeCustom: {
      width: 1920,
      height: 1080
    },
    videoCodec: 'h264',    // 可选: 'h264', 'h265', 'av1', 'auto'
    forceVideoElementRenderer: false,
    canvasRenderer: false,
    playAudioLocal: false,
    audioSampleQueueSize: 20,
    mouseScrollMode: 'highres',
    controllerConfig: {
      invertAB: false,
      invertXY: false,
      sendIntervalOverride: null
    },
    dataTransport: 'auto',  // 可选: 'auto', 'webrtc', 'websocket'
    toggleFullscreenWithKeybind: true,
    pageStyle: 'standard',
    hdr: false
  },

  // 输入配置
  inputConfig: {
    mouseMode: 'follow',      // 可选: 'follow', 'relative', 'pointAndDrag'
    mouseScrollMode: 'highres',
    touchMode: 'pointAndDrag', // 可选: 'touch', 'mouseRelative', 'pointAndDrag'
    controllerConfig: {
      invertAB: false,
      invertXY: false,
      sendIntervalOverride: null
    }
  }
}

// 构建 API URL
export function buildUrl(path) {
  // 如果有配置 VITE_API_BASE_URL，使用它；否则使用当前域名
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`
  }
  return `${window.location.origin}${MOONLIGHT_CONFIG.apiBaseUrl}${path}`
}
