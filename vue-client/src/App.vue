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
        @user-click="showUserMenu"
      />

      <main class="main-content">
        <!-- 主机列表 -->
        <HostList
          v-if="!selectedHost"
          :hosts="hosts"
          :user="currentUser"
          @select="selectHost"
          @logout="logout"
          @refresh="loadHosts"
        />

        <!-- 游戏列表 -->
        <template v-else>
          <!-- 返回栏 -->
          <div class="games-topbar">
            <button class="btn-back" @click="selectedHost = null">← 返回主机列表</button>
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
import HostList from '@/components/HostList.vue'
import AppFooter from '@/components/AppFooter.vue'
import { apiLogin, apiAuthenticate, apiGetUser, apiGetHosts, apiGetApps, apiGetAppImage } from '@/services/api.js'
import { MOONLIGHT_CONFIG } from '@/config/moonlight.js'

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
  fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
}

// 加载主机列表
const loadHosts = async () => {
  try {
    const stream = await apiGetHosts()
    const first = await stream.next()
    if (first && first.hosts) {
      hosts.value = first.hosts
    }
    let item
    while ((item = await stream.next()) !== null) {
      if (item.host_id !== undefined) {
        const idx = hosts.value.findIndex(h => h.host_id === item.host_id)
        if (idx !== -1) {
          hosts.value[idx] = { ...hosts.value[idx], ...item }
        }
      }
    }
  } catch (e) {
    console.error('加载主机列表失败:', e)
  }
}

// 选择主机
const selectHost = async (host) => {
  selectedHost.value = host
  searchQuery.value = ''
  appsLoading.value = true

  try {
    const appList = await apiGetApps(host.host_id)
    apps.value = appList
    appList.forEach(app => loadAppImage(host.host_id, app.app_id))
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
  selectedHost.value = null
}

const handleNav = (nav) => {
  console.log('导航到:', nav)
  // 可以在这里添加路由跳转逻辑
}

const showUserMenu = () => {
  console.log('显示用户菜单')
  // 可以在这里显示用户下拉菜单
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

.btn-back {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #fff;
}

.games-topbar h2 {
  font-size: 20px;
  margin: 0;
  color: #ddd;
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
</style>
