// Moonlight Web 配置
// 根据你的后端服务地址修改以下配置

// 从环境变量获取 API 基础地址（生产环境使用 .env.production 中的配置）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

function getRuntimeUrlSearchParams() {
  const params = new URLSearchParams(window.location.search || '')
  const hash = window.location.hash || ''
  const idx = hash.indexOf('?')
  if (idx !== -1) {
    const hashParams = new URLSearchParams(hash.slice(idx + 1))
    for (const [key, value] of hashParams.entries()) {
      if (!params.has(key)) params.set(key, value)
    }
  }
  return params
}

function normalizeApiBaseUrl(raw) {
  if (!raw) return ''
  let url = String(raw).trim()
  if (!url) return ''
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
    url = `${window.location.protocol}//${url}`
  }
  url = url.replace(/\/+$/, '')
  url = url.replace(/\/api$/i, '')
  return url
}

function resolveApiBaseUrl() {
  const params = getRuntimeUrlSearchParams()
  let api =
    params.get('api') ||
    params.get('apiBaseUrl') ||
    params.get('api_base_url') ||
    params.get('backend') ||
    params.get('server')

  if (!api) {
    const ip = params.get('ip') || params.get('host') || params.get('hostIp') || params.get('host_ip')
    const port = params.get('port') || params.get('apiPort') || params.get('api_port')
    if (ip && port) api = `${ip}:${port}`
  }

  api = normalizeApiBaseUrl(api)
  if (api) {
    try {
      localStorage.setItem('moonlight_api_base_url', api)
    } catch {}
    return api
  }

  try {
    const stored = localStorage.getItem('moonlight_api_base_url')
    if (stored) return normalizeApiBaseUrl(stored)
  } catch {}

  return normalizeApiBaseUrl(API_BASE_URL)
}

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
  const apiBaseUrl = resolveApiBaseUrl()
  if (apiBaseUrl) return `${apiBaseUrl}${path}`
  return `${window.location.origin}${MOONLIGHT_CONFIG.apiBaseUrl}${path}`
}

export function getRuntimePin() {
  const params = getRuntimeUrlSearchParams()
  const pin = params.get('pin') || params.get('pairPin') || params.get('pair_pin') || params.get('p')
  if (pin) {
    try {
      sessionStorage.setItem('moonlight_pin', pin)
    } catch {}
    return pin
  }
  try {
    return sessionStorage.getItem('moonlight_pin')
  } catch {
    return null
  }
}

export function getRuntimeUrlParams() {
  return getRuntimeUrlSearchParams()
}
