<template>
  <div class="game-stream" ref="streamContainer">
    <!-- 流画面容器 -->
    <div class="stream-viewport" ref="viewport">
      <!-- Moonlight 会在这里创建 video/canvas 元素 -->
    </div>
    
    <!-- 输入捕获层 -->
    <div 
      class="input-layer"
      ref="inputLayer"
      id="input"
      tabindex="0"
    ></div>

    <!-- 控制栏 -->
    <div class="controls-bar" :class="{ hidden: isFullscreen && !showControls }">
      <button class="control-btn" @click="toggleFullscreen" title="全屏">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </button>
      <button class="control-btn" @click="togglePointerLock" title="鼠标锁定(3D游戏)">
        {{ isPointerLocked ? '解锁鼠标' : '锁定鼠标' }}
      </button>
      <button class="control-btn" @click="toggleStats" title="显示统计">
        {{ showStats ? '隐藏统计' : '显示统计' }}
      </button>
      <button class="control-btn danger" @click="stopStream" title="退出游戏">
        退出游戏
      </button>
    </div>

    <!-- 统计信息 -->
    <div class="stats-panel" v-if="showStats && stats">
      <div>编码: {{ stats.codec || 'N/A' }}</div>
      <div>分辨率: {{ stats.width }}x{{ stats.height }}</div>
      <div>FPS: {{ stats.fps }}</div>
      <div>码率: {{ stats.bitrate }} kbps</div>
      <div>延迟: {{ stats.latency }} ms</div>
      <div>丢包: {{ stats.packetLoss }}%</div>
    </div>

    <!-- 连接状态 -->
    <div class="connection-status" :class="connectionStatus.type" v-if="connectionStatus.show">
      <div class="status-text">{{ connectionStatus.message }}</div>
      <div class="status-detail" v-if="connectionStatus.detail">{{ connectionStatus.detail }}</div>
    </div>

    <!-- 虚拟键盘按钮 (移动端) -->
    <button 
      class="virtual-keyboard-btn" 
      @click="showVirtualKeyboard"
      v-if="isMobile"
    >
      键盘
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { streamService, createInputHandlers } from '@/services/streamService.js'

const props = defineProps({
  hostId: { type: Number, required: true },
  appId: { type: Number, required: true },
  settings: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['connected', 'disconnected', 'error', 'ready'])

// DOM 引用
const streamContainer = ref(null)
const viewport = ref(null)
const inputLayer = ref(null)

// 状态
const isFullscreen = ref(false)
const isPointerLocked = ref(false)
const showStats = ref(false)
const showControls = ref(true)
const isMobile = ref(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
const stats = ref(null)
const connectionStatus = ref({ show: false, message: '', detail: '', type: 'info' })

let inputHandlers = null
let statsInterval = null
let controlsHideTimer = null
let viewportObserver = null

// ── Canvas 自适应布局 ──────────────────────────────────────────────
// 记录当前视频流内部分辨率
const videoResolution = { width: 0, height: 0 }

const onUserInteraction = () => {
  inputLayer.value?.focus()
  streamService.getVideoRenderer()?.onUserInteraction?.()
  streamService.getAudioPlayer()?.onUserInteraction?.()
}

/**
 * 根据视频流分辨率和 viewport 容器尺寸，计算并应用
 * "contain" 样式（保持宽高比居中，不超出容器）
 */
const fitCanvas = () => {
  const vp = viewport.value
  if (!vp) return
  const canvas = vp.querySelector('canvas.video-stream')
  if (!canvas) return

  const { width: vw, height: vh } = vp.getBoundingClientRect()
  const { width: cw, height: ch } = videoResolution

  if (!cw || !ch || !vw || !vh) return

  const scaleW = vw / cw
  const scaleH = vh / ch
  const scale = Math.min(scaleW, scaleH)

  const displayW = Math.round(cw * scale)
  const displayH = Math.round(ch * scale)

  canvas.style.width  = `${displayW}px`
  canvas.style.height = `${displayH}px`
  // 移除 max-width/max-height 限制，改由 JS 精确控制尺寸
  canvas.style.maxWidth  = 'none'
  canvas.style.maxHeight = 'none'
}

/** 处理 canvas 上的 video-resize 自定义事件（视频流分辨率变化） */
const onVideoResize = (e) => {
  videoResolution.width  = e.detail.width
  videoResolution.height = e.detail.height
  fitCanvas()
}

// 显示连接状态
const showStatus = (message, detail = '', type = 'info') => {
  connectionStatus.value = { show: true, message, detail, type }
}

const hideStatus = () => {
  connectionStatus.value.show = false
}

// 启动流
const startStream = async () => {
  try {
    showStatus('正在连接云游戏服务器...', '', 'loading')
    
    // 设置流事件监听
    streamService.on('connected', () => {
      showStatus('连接成功，正在初始化...', '', 'success')
    })
    
    streamService.on('ready', () => {
      hideStatus()
      emit('ready')
      startStatsUpdate()
    })
    
    streamService.on('error', (e) => {
      const { message } = e.detail
      showStatus('连接错误', message, 'error')
      emit('error', e.detail)
    })
    
    streamService.on('debug', (e) => {
      const { message, type } = e.detail
      // fatalDescription 只在连接已建立后才显示为错误，且排除 disconnected（暂时断开，会自动重连）
      if (type === 'fatalDescription' && streamService.isConnected && !/disconnected/i.test(message)) {
        showStatus('连接失败', message, 'error')
      }
      console.log(`[Moonlight] ${message}`)
    })

    // 启动流
    await streamService.startStream(
      props.hostId, 
      props.appId, 
      viewport.value,
      props.settings
    )
    
    emit('connected')
    
    // 焦点设置到输入层
    inputLayer.value?.focus()
    
  } catch (error) {
    showStatus('启动失败', error.message, 'error')
    emit('error', { message: error.message, error })
  }
}

// 停止流
const stopStream = () => {
  streamService.stop()
  stopStatsUpdate()
  emit('disconnected')
}

// 输入事件处理
const setupInputHandlers = () => {
  inputHandlers = createInputHandlers(streamService)
}

const onKeyDown = (e) => {
  onUserInteraction()
  inputHandlers?.onKeyDown(e)
  // 全屏快捷键: Ctrl+Shift+F
  if (e.ctrlKey && e.shiftKey && e.key === 'F') {
    toggleFullscreen()
  }
  e.stopPropagation()
}

const onKeyUp = (e) => {
  onUserInteraction()
  inputHandlers?.onKeyUp(e)
  e.stopPropagation()
}

const onMouseDown = (e) => {
  onUserInteraction()
  inputHandlers?.onMouseDown(e, getStreamRect())
  e.stopPropagation()
}

const onMouseUp = (e) => {
  inputHandlers?.onMouseUp(e)
  e.stopPropagation()
}

const onMouseMove = (e) => {
  inputHandlers?.onMouseMove(e, getStreamRect())
  resetControlsTimer()
  e.stopPropagation()
}

const onWheel = (e) => {
  inputHandlers?.onMouseWheel(e)
  e.stopPropagation()
}

const onTouchStart = (e) => {
  onUserInteraction()
  inputHandlers?.onTouchStart(e, getStreamRect())
  e.stopPropagation()
}

const onTouchEnd = (e) => {
  onUserInteraction()
  inputHandlers?.onTouchEnd(e, getStreamRect())
  e.stopPropagation()
}

const onTouchMove = (e) => {
  inputHandlers?.onTouchMove(e, getStreamRect())
  e.stopPropagation()
}

const onTouchCancel = (e) => {
  onUserInteraction()
  inputHandlers?.onTouchCancel(e, getStreamRect())
  e.stopPropagation()
}

let cleanupNativeInputListeners = null

const isUiEvent = (event) => {
  const target = event?.target
  if (!(target instanceof Element)) return false
  if (target.closest('.controls-bar')) return true
  if (target.closest('.stats-panel')) return true
  if (target.closest('.connection-status')) return true
  if (target.closest('.virtual-keyboard-btn')) return true
  return false
}

const bindNativeInputListeners = () => {
  if (cleanupNativeInputListeners) return
  const layer = inputLayer.value
  if (!layer) return

  const bindings = []
  const on = (target, type, listener) => {
    target.addEventListener(type, listener, { passive: false })
    bindings.push({ target, type, listener })
  }

  const wrap = (fn) => (e) => {
    if (isUiEvent(e)) return
    fn(e)
  }

  const onContextMenu = (e) => {
    if (isUiEvent(e)) return
    e.preventDefault()
    e.stopPropagation()
  }

  for (const el of [document, layer]) {
    on(el, 'keydown', wrap(onKeyDown))
    on(el, 'keyup', wrap(onKeyUp))
    on(el, 'mousedown', wrap(onMouseDown))
    on(el, 'mouseup', wrap(onMouseUp))
    on(el, 'mousemove', wrap(onMouseMove))
    on(el, 'wheel', wrap(onWheel))
    on(el, 'contextmenu', onContextMenu)
    on(el, 'touchstart', wrap(onTouchStart))
    on(el, 'touchend', wrap(onTouchEnd))
    on(el, 'touchcancel', wrap(onTouchCancel))
    on(el, 'touchmove', wrap(onTouchMove))
  }

  cleanupNativeInputListeners = () => {
    for (const { target, type, listener } of bindings) {
      target.removeEventListener(type, listener)
    }
    cleanupNativeInputListeners = null
  }
}

// 获取流画面区域
const getStreamRect = () => {
  return streamService.getVideoRenderer()?.getStreamRect() || viewport.value?.getBoundingClientRect() || new DOMRect()
}

// 全屏控制
const toggleFullscreen = async () => {
  if (isFullscreen.value) {
    await streamService.exitFullscreen()
    isFullscreen.value = false
  } else {
    await streamService.requestFullscreen()
    isFullscreen.value = true
  }
}

// 指针锁定
const togglePointerLock = async () => {
  if (isPointerLocked.value) {
    streamService.exitPointerLock()
  } else {
    await streamService.requestPointerLock(inputLayer.value)
  }
}

// 监听全屏变化
const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 监听指针锁定变化
const onPointerLockChange = () => {
  isPointerLocked.value = document.pointerLockElement === inputLayer.value
  if (!isPointerLocked.value) {
    streamService.setInputConfig({ mouseMode: 'follow' })
  }
}

// 统计信息
const toggleStats = () => {
  showStats.value = !showStats.value
}

const startStatsUpdate = () => {
  const streamStats = streamService.getStats()
  if (!streamStats) return
  
  statsInterval = setInterval(() => {
    const current = streamStats.getCurrentStats()
    if (current) {
      stats.value = {
        codec: streamStats.videoCodec,
        width: streamStats.width,
        height: streamStats.height,
        fps: current.fps,
        bitrate: Math.round(current.bitrate / 1000),
        latency: current.latency,
        packetLoss: current.packetLoss
      }
    }
  }, 1000)
}

const stopStatsUpdate = () => {
  if (statsInterval) {
    clearInterval(statsInterval)
    statsInterval = null
  }
}

// 控制栏自动隐藏
const resetControlsTimer = () => {
  showControls.value = true
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
  }
  if (isFullscreen.value) {
    controlsHideTimer = setTimeout(() => {
      showControls.value = false
    }, 3000)
  }
}

// 虚拟键盘
const showVirtualKeyboard = () => {
  // 创建一个临时的 input 元素来触发虚拟键盘
  const input = document.createElement('input')
  input.type = 'text'
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.focus()
  
  input.addEventListener('input', (e) => {
    const text = e.target.value
    if (text) {
      streamService.sendText(text)
      e.target.value = ''
    }
  })
  
  input.addEventListener('blur', () => {
    input.remove()
  })
}

// 游戏手柄检测
const onGamepadConnected = (e) => {
  inputHandlers?.onGamepadConnect(e)
}

const onGamepadDisconnected = (e) => {
  inputHandlers?.onGamepadDisconnect(e)
}

// 窗口失焦时释放按键
const onWindowBlur = () => {
  streamService.getInput()?.raiseAllKeys()
}

// 页面可见性变化
const onVisibilityChange = () => {
  if (document.visibilityState !== 'visible') {
    streamService.getInput()?.raiseAllKeys()
  }
}

onMounted(() => {
  setupInputHandlers()
  bindNativeInputListeners()
  startStream()
  
  // 全局事件监听
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('pointerlockchange', onPointerLockChange)
  window.addEventListener('gamepadconnected', onGamepadConnected)
  window.addEventListener('gamepaddisconnected', onGamepadDisconnected)
  window.addEventListener('blur', onWindowBlur)
  document.addEventListener('visibilitychange', onVisibilityChange)
  
  // 监听视频流分辨率变化（canvas 内部尺寸改变时派发 video-resize）
  viewport.value?.addEventListener('video-resize', onVideoResize)

  // 用 ResizeObserver 监听 viewport 容器尺寸变化，同步重新 fit
  viewportObserver = new ResizeObserver(() => fitCanvas())
  viewportObserver.observe(viewport.value)

  // 初始化已连接的游戏手柄
  for (const gamepad of navigator.getGamepads()) {
    if (gamepad) {
      inputHandlers?.onGamepadConnect({ gamepad })
    }
  }
})

onBeforeUnmount(() => {
  stopStream()
  cleanupNativeInputListeners?.()
  
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('pointerlockchange', onPointerLockChange)
  window.removeEventListener('gamepadconnected', onGamepadConnected)
  window.removeEventListener('gamepaddisconnected', onGamepadDisconnected)
  window.removeEventListener('blur', onWindowBlur)
  document.removeEventListener('visibilitychange', onVisibilityChange)

  viewport.value?.removeEventListener('video-resize', onVideoResize)
  viewportObserver?.disconnect()
  viewportObserver = null
  
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
  }
})
</script>

<style scoped>
.game-stream {
  width: 100vw;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
}

.stream-viewport {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stream-viewport :deep(video),
.stream-viewport :deep(canvas) {
  display: block;
  /* 初始尺寸由 CSS contain 兜底，JS fitCanvas() 会精确覆盖 */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.input-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  outline: none;
  pointer-events: auto;
  touch-action: none;
}

.controls-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  z-index: 20;
  transition: opacity 0.3s;
}

.controls-bar.hidden {
  opacity: 0;
  pointer-events: none;
}

.controls-bar:hover {
  opacity: 1 !important;
  pointer-events: auto;
}

.control-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.control-btn:hover {
  background: #2563eb;
}

.control-btn.danger {
  background: #ef4444;
}

.control-btn.danger:hover {
  background: #dc2626;
}

.stats-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  color: #0f0;
  z-index: 20;
  line-height: 1.6;
}

.connection-status {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 30px 50px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  text-align: center;
  z-index: 30;
}

.connection-status.loading {
  border: 2px solid #3b82f6;
}

.connection-status.success {
  border: 2px solid #10b981;
}

.connection-status.error {
  border: 2px solid #ef4444;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.status-detail {
  font-size: 14px;
  color: #9ca3af;
}

.virtual-keyboard-btn {
  position: absolute;
  bottom: 80px;
  right: 20px;
  padding: 12px 24px;
  background: rgba(59, 130, 246, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  z-index: 20;
}
</style>
