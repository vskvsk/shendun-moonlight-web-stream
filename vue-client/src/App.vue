<template>
  <div class="app">
    <!-- 登录界面 -->
    <LoginScreen
      v-if="!isLoggedIn"
      v-model:username="loginForm.username"
      v-model:password="loginForm.password"
      :loading="isLoading"
      :error="loginError"
      @login="handleLogin"
      @guest="guestLogin"
    />

    <!-- 游戏主界面 -->
    <template v-else-if="isLoggedIn && !isStreaming">
      <!-- 顶部导航 -->
      <TopNav
        v-model="searchQuery"
        @logo-click="goHome"
        @nav-click="handleNav"
        @logout="logout"
      />

      <main class="main-content">
        <div v-if="!selectedHost" class="host-transition">
          <div class="spinner" />
          <h2 class="host-transition-title">{{ hostTransitionTitle }}</h2>
          <p class="host-transition-subtitle">{{ hostTransitionSubtitle }}</p>
          <div class="host-transition-actions">
            <button class="btn-secondary" @click="reloadAndConnect">重试</button>
            <button class="btn-secondary" @click="logout">退出登录</button>
          </div>
        </div>

        <!-- 游戏列表 -->
        <template v-else>
          <!-- 返回栏 -->
          <div class="games-topbar">
            <h2>{{ selectedHost.name }}</h2>
          </div>

          <!-- Hero 轮播 -->
          <HeroCarousel
            :apps="heroApps"
            :app-images="appImages"
            :loading="appsLoading"
            @play="startGame"
          />

          <!-- 热玩排行 -->
          <HotRanking
            :apps="filteredApps"
            :app-images="appImages"
            @play="startGame"
          />

          <!-- 游戏网格 -->
          <GameGrid
            :apps="filteredApps"
            :app-images="appImages"
            :title="searchQuery ? '搜索结果' : '全部游戏'"
            @play="startGame"
          />

          <!-- 搜索空态 -->
          <div class="empty-wrap" v-if="filteredApps.length === 0 && searchQuery">
            <div class="empty-icon">🔍</div>
            <p>未找到匹配的游戏</p>
            <button class="btn-clear" @click="searchQuery = ''">清除搜索</button>
          </div>

          <!-- 无游戏空态 -->
          <div class="empty-wrap" v-else-if="filteredApps.length === 0 && !appsLoading">
            <div class="empty-icon">🎮</div>
            <p>该主机暂无游戏</p>
          </div>
        </template>
      </main>

      <!-- 底部 -->
      <AppFooter />
    </template>

    <!-- 游戏流界面 -->
    <GameStream
      v-else
      :host-id="selectedHost.host_id"
      :app-id="selectedApp.app_id"
      :settings="streamSettings"
      @connected="onStreamConnected"
      @disconnected="onStreamDisconnected"
      @error="onStreamError"
      @ready="onStreamReady"
    />

    <teleport to="body">
      <div v-if="pairingPin" class="modal-backdrop">
        <div class="modal pairing-modal">
          <div class="modal-header">
            <h3>正在配对</h3>
          </div>
          <div class="modal-body text-center">
            <p>请在目标主机的 Sunshine/GeForce Experience 中输入以下 PIN：</p>
            <div class="pin-display">{{ pairingPin }}</div>
            <p class="waiting-text">等待配对完成...</p>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import GameStream from '@/components/GameStream.vue'
import TopNav from '@/components/TopNav.vue'
import HeroCarousel from '@/components/HeroCarousel.vue'
import HotRanking from '@/components/HotRanking.vue'
import GameGrid from '@/components/GameGrid.vue'
import LoginScreen from '@/components/LoginScreen.vue'
import AppFooter from '@/components/AppFooter.vue'
import { apiLogin, apiAuthenticate, apiGetUser, apiGetHosts, apiGetHost, apiPostHost, apiPostPair, apiGetApps, apiGetAppImage } from '@/services/api.js'
import { MOONLIGHT_CONFIG, getRuntimeUrlParams, getRuntimePin } from '@/config/moonlight.js'

const urlParams = getRuntimeUrlParams()

function getFirstParam(keys) {
  for (const key of keys) {
    const value = urlParams.get(key)
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return null
}

function toInt(value) {
  if (value == null) return null
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : null
}

const deepLink = {
  hostId: toInt(getFirstParam(['hostId', 'host_id', 'hostID'])),
  appId: toInt(getFirstParam(['appId', 'app_id', 'appID'])),
  address: getFirstParam(['address', 'addr', 'hostAddress', 'host_address']),
  ip: getFirstParam(['ip', 'hostIp', 'host_ip']),
  port: toInt(getFirstParam(['port', 'hostPort', 'host_port', 'http_port']))
}

function normalizeAddress(value) {
  if (!value) return ''
  let v = String(value).trim()
  v = v.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
  v = v.replace(/[/?#].*$/, '')
  v = v.replace(/\/+$/, '')
  return v.toLowerCase()
}

function parseHostAndPort(value) {
  const raw = normalizeAddress(value)
  if (!raw) return { host: '', port: null }
  const lastColon = raw.lastIndexOf(':')
  if (lastColon === -1) return { host: raw, port: null }
  const maybePort = raw.slice(lastColon + 1)
  if (!/^\d+$/.test(maybePort)) return { host: raw, port: null }
  const port = Number.parseInt(maybePort, 10)
  if (!Number.isFinite(port)) return { host: raw, port: null }
  return { host: raw.slice(0, lastColon), port }
}

const deepLinkResolved = (() => {
  const fromAddress = deepLink.address ? parseHostAndPort(deepLink.address) : null
  const host = (deepLink.ip ? normalizeAddress(deepLink.ip) : '') || (fromAddress?.host ?? '')
  const port = deepLink.port ?? (fromAddress?.port ?? null)
  return { host, port }
})()

function hostMatchesDeepLink(host) {
  if (!host) return false
  if (deepLink.hostId != null) return Number(host.host_id) === deepLink.hostId
  const hostAddress = normalizeAddress(host.address)
  if (!deepLinkResolved.host) return false
  if (hostAddress !== deepLinkResolved.host && !hostAddress.includes(deepLinkResolved.host)) return false
  if (deepLinkResolved.port == null) return true
  const p = deepLinkResolved.port
  if (Number(host.http_port) === p) return true
  if (Number(host.https_port) === p) return true
  if (Number(host.external_port) === p) return true
  return hostAddress.endsWith(`:${p}`)
}

// ============ 状态 ============
const isLoggedIn = ref(false)
const isLoading = ref(false)
const loginError = ref('')
const currentUser = ref(null)
const hosts = ref([])
const apps = ref([])
const selectedHost = ref(null)
const selectedApp = ref(null)
const isStreaming = ref(false)
const appImages = ref(new Map())
const searchQuery = ref('')
const appsLoading = ref(false)
const pairingPin = ref(null)
const hostsLoading = ref(false)

const hostTransitionTitle = computed(() => {
  if (pairingPin.value) return '正在配对主机'
  if (hostsLoading.value) return '正在加载主机'
  if (!hosts.value.length) return '正在等待主机'
  return '正在连接主机'
})

const hostTransitionSubtitle = computed(() => {
  if (pairingPin.value) return '请在 Sunshine/GeForce Experience 中完成配对'
  if (hostsLoading.value) return '正在获取主机列表...'
  if (!hosts.value.length && (deepLinkResolved.host || deepLink.hostId != null)) return '正在创建或查找目标主机...'
  if (!hosts.value.length) return '未发现主机，请先在后端添加主机，或通过 URL 传入 address 参数'
  return '初始化中...'
})

// ============ 表单和设置 ============
const loginForm = reactive({
  username: 'admin',
  password: 'admin'
})

const streamSettings = reactive({ ...MOONLIGHT_CONFIG.defaultSettings })

// ============ 计算属性 ============
const filteredApps = computed(() => {
  if (!searchQuery.value) return apps.value
  const query = searchQuery.value.toLowerCase()
  return apps.value.filter(app => app.title.toLowerCase().includes(query))
})

const heroApps = computed(() => filteredApps.value.slice(0, 5))

// ============ 方法 ============
// 检查登录状态
const checkAuth = async () => {
  try {
    const isAuth = await apiAuthenticate()
    if (isAuth) {
      currentUser.value = await apiGetUser()
      isLoggedIn.value = true
      loadHosts()
    }
  } catch (e) {
    console.log('未登录')
  }
}

// 登录
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    loginError.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true
  loginError.value = ''

  try {
    const success = await apiLogin(loginForm.username, loginForm.password)
    if (success) {
      currentUser.value = await apiGetUser()
      isLoggedIn.value = true
      loadHosts()
    } else {
      loginError.value = '用户名或密码错误'
    }
  } catch (e) {
    loginError.value = '登录失败: ' + e.message
  } finally {
    isLoading.value = false
  }
}

// 游客登录
const guestLogin = async () => {
  try {
    const isAuth = await apiAuthenticate()
    if (isAuth) {
      currentUser.value = await apiGetUser()
      isLoggedIn.value = true
      loadHosts()
    }
  } catch (e) {
    loginError.value = '游客访问失败，请使用账号登录'
  }
}

// 退出登录
const logout = () => {
  isLoggedIn.value = false
  currentUser.value = null
  hosts.value = []
  apps.value = []
  selectedHost.value = null
  selectedApp.value = null
  isStreaming.value = false
  pairingPin.value = null
  hostsLoading.value = false
  autoLinkState.hostSelected = false
  autoLinkState.appStarted = false
  autoLinkState.hostCreated = false
  autoLinkState.pairingStarted = false
  fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
}

const autoLinkState = reactive({ hostSelected: false, appStarted: false, hostCreated: false, pairingStarted: false })

const mergeHostIntoList = (host) => {
  if (!host || host.host_id == null) return
  const idx = hosts.value.findIndex(h => h.host_id === host.host_id)
  if (idx === -1) {
    hosts.value = [...hosts.value, host]
  } else {
    hosts.value[idx] = { ...hosts.value[idx], ...host }
  }
}

const tryPairHostWithRuntimePin = async (host) => {
  const pin = getRuntimePin()
  if (!pin) return host
  if (!host || host.host_id == null) return host
  if (host.paired && host.paired !== 'NotPaired') return host

  try {
    const stream = await apiPostPair({ host_id: host.host_id, pin })
    const stage2 = await stream.next()

    const pairedHost =
      (stage2 && typeof stage2 === 'object' && stage2.Paired) ||
      (stream.response && typeof stream.response === 'object' && stream.response.Paired) ||
      null

    if (pairedHost) {
      mergeHostIntoList(pairedHost)
      return pairedHost
    }

    const refreshed = await apiGetHost(host.host_id)
    mergeHostIntoList(refreshed)
    return refreshed
  } catch {
    return host
  }
}

const tryAutoSelectHost = async () => {
  if (autoLinkState.hostSelected) return
  if (!isLoggedIn.value) return
  if (selectedHost.value) return

  let matched = null

  if (deepLink.hostId != null) {
    try {
      const detailed = await apiGetHost(deepLink.hostId)
      mergeHostIntoList(detailed)
      matched = detailed
    } catch {
    }
  }

  if (!matched && deepLinkResolved.host) {
    for (const host of hosts.value) {
      if (host?.address) {
        if (hostMatchesDeepLink(host)) {
          matched = host
          break
        }
      } else if (host?.host_id != null) {
        try {
          const detailed = await apiGetHost(host.host_id)
          mergeHostIntoList(detailed)
          if (hostMatchesDeepLink(detailed)) {
            matched = detailed
            break
          }
        } catch {
        }
      }
    }
  }

  if (!matched && deepLinkResolved.host && !autoLinkState.hostCreated) {
    autoLinkState.hostCreated = true
    try {
      const data = { address: deepLinkResolved.host, ...(deepLinkResolved.port != null ? { http_port: deepLinkResolved.port } : {}) }
      const created = await apiPostHost(data)
      mergeHostIntoList(created)
      matched = created
    } catch {
    }
  }

  if (!matched) {
    if (hosts.value.length) {
      let best = null
      let bestScore = -1
      for (const host of hosts.value) {
        if (!host || host.host_id == null) continue
        let score = 0
        if (host.paired && host.paired !== 'NotPaired') score += 10
        if (host.server_state != null) score += 5
        if (best == null || score > bestScore || (score === bestScore && host.host_id < best.host_id)) {
          best = host
          bestScore = score
        }
      }
      matched = best
    }
  }

  if (!matched) return

  if (matched.paired === 'NotPaired') {
    if (getRuntimePin()) {
      matched = await tryPairHostWithRuntimePin(matched)
    } else if (!autoLinkState.pairingStarted) {
      autoLinkState.pairingStarted = true
      try {
        const stream = await apiPostPair({ host_id: matched.host_id })
        if (stream.response && typeof stream.response === 'object' && stream.response.Pin) {
          pairingPin.value = stream.response.Pin
          const stage2 = await stream.next()
          pairingPin.value = null

          const pairedHost =
            (stage2 && typeof stage2 === 'object' && stage2.Paired) ||
            (stream.response && typeof stream.response === 'object' && stream.response.Paired) ||
            null

          if (pairedHost) {
            mergeHostIntoList(pairedHost)
            matched = pairedHost
          } else {
            const refreshed = await apiGetHost(matched.host_id)
            mergeHostIntoList(refreshed)
            matched = refreshed
          }
        }
      } catch {
        pairingPin.value = null
        return
      }
    } else {
      return
    }
  }

  if (matched.paired === 'NotPaired') {
    return
  }

  autoLinkState.hostSelected = true
  await selectHost(matched)
}

// 加载主机列表
const loadHosts = async () => {
  hostsLoading.value = true
  try {
    const stream = await apiGetHosts()
    const first = await stream.next()
    if (first && first.hosts) {
      hosts.value = first.hosts
      await tryAutoSelectHost()
    }
    let item
    while ((item = await stream.next()) !== null) {
      if (item.host_id !== undefined) {
        const idx = hosts.value.findIndex(h => h.host_id === item.host_id)
        if (idx !== -1) {
          hosts.value[idx] = { ...hosts.value[idx], ...item }
        }
      }
      await tryAutoSelectHost()
    }
  } catch (e) {
    console.error('加载主机列表失败:', e)
  } finally {
    hostsLoading.value = false
  }
}

const reloadAndConnect = async () => {
  selectedHost.value = null
  selectedApp.value = null
  isStreaming.value = false
  apps.value = []
  appImages.value = new Map()
  pairingPin.value = null
  autoLinkState.hostSelected = false
  autoLinkState.appStarted = false
  autoLinkState.hostCreated = false
  autoLinkState.pairingStarted = false
  await loadHosts()
}

// 选择主机
const selectHost = async (host) => {
  let selected = host
  if (selected?.paired === 'NotPaired' && getRuntimePin()) {
    selected = await tryPairHostWithRuntimePin(selected)
  }
  selectedHost.value = selected
  searchQuery.value = ''
  appsLoading.value = true

  try {
    const appList = await apiGetApps(selected.host_id)
    apps.value = appList
    appList.forEach(app => loadAppImage(selected.host_id, app.app_id))
    if (deepLink.appId != null && !autoLinkState.appStarted) {
      autoLinkState.appStarted = true
      const matchedApp = appList.find(app => Number(app.app_id) === deepLink.appId) || { app_id: deepLink.appId }
      startGame(matchedApp)
    }
  } catch (e) {
    console.error('加载游戏列表失败:', e)
    apps.value = []
  } finally {
    appsLoading.value = false
  }
}

// 加载游戏封面
const loadAppImage = async (hostId, appId) => {
  try {
    const blob = await apiGetAppImage({ host_id: hostId, app_id: appId })
    const url = URL.createObjectURL(blob)
    appImages.value.set(appId, url)
  } catch (e) {
    console.error('加载游戏封面失败:', e)
  }
}

// 开始游戏
const startGame = (app) => {
  selectedApp.value = app
  isStreaming.value = true
}

// 导航处理
const goHome = () => {
  window.location.reload()
}

const handleNav = (nav) => {
  console.log('导航到:', nav)
  // 可以在这里添加路由跳转逻辑
}

// 流事件处理
const onStreamConnected = () => console.log('游戏流已连接')
const onStreamDisconnected = () => { isStreaming.value = false; selectedApp.value = null }
const onStreamError = (error) => {
  console.error('游戏流错误:', error)
  isStreaming.value = false
}
const onStreamReady = () => console.log('游戏流准备就绪')

// ============ 生命周期 ============
onMounted(() => checkAuth())
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 60px 80px;
  width: 100%;
  flex: 1;
}

.games-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-top: 64px;
}

.games-topbar h2 {
  font-size: 20px;
  margin: 0;
  color: #ddd;
}

.host-transition {
  padding-top: 96px;
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
}

.host-transition-title {
  margin: 8px 0 0;
  font-size: 20px;
  color: #fff;
}

.host-transition-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  max-width: 520px;
}

.host-transition-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-secondary {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
}

.spinner {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: rgba(0, 212, 255, 0.85);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-wrap {
  text-align: center;
  padding: 100px 0;
  color: #555;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-wrap p {
  font-size: 16px;
  margin: 0 0 20px;
}

.btn-clear {
  padding: 10px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
}

@media (max-width: 1200px) {
  .main-content { padding: 32px 24px 60px; }
}

@media (max-width: 768px) {
  .games-topbar { padding-top: 64px; }
  .games-topbar h2 { font-size: 18px; }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal {
  width: min(520px, 100%);
  background: rgba(18, 18, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.pairing-modal {
  width: min(400px, 100%);
}

.text-center {
  text-align: center;
}

.pin-display {
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #00d4ff;
  margin: 20px 0;
  padding: 16px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 12px;
}

.waiting-text {
  color: #888;
  font-size: 14px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
</style>
