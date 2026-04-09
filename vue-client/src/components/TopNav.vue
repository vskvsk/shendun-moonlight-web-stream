<template>
  <header class="top-nav">
    <div class="nav-left">
      <!-- Logo -->
      <div class="logo" @click="$emit('logo-click')">
        <svg class="logo-icon" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7b2cbf"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#logoGrad)" filter="url(#glow)"/>
          <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
          <polygon points="20,18 20,30 30,24" fill="#fff"/>
        </svg>
        <span class="logo-text">Moon<span class="logo-highlight">Game</span></span>
      </div>

      <!-- 导航链接 -->
      <nav class="nav-links">
        <a href="#" class="nav-link active" @click.prevent="$emit('nav-click', 'home')">首页</a>
        <a href="#" class="nav-link" @click.prevent="$emit('nav-click', 'library')">游戏库</a>
        <a href="#" class="nav-link" @click.prevent="$emit('nav-click', 'ranking')">热玩排行</a>
      </nav>
    </div>

    <div class="nav-right">
      <!-- 搜索框 -->
      <div class="search-box" v-if="showSearch">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke-width="2"/>
          <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <input
          type="text"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          placeholder="搜索游戏..."
        />
        <button v-if="modelValue" class="search-clear" @click="$emit('update:modelValue', '')">×</button>
      </div>

      <!-- 用户区域 -->
      <div class="user-area">
        <div class="user-avatar" @click.stop="toggleUserMenu">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div v-if="isUserMenuOpen" class="user-menu" @click.stop>
          <button class="user-menu-item" @click="onLogout">退出系统</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  showSearch: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'logo-click', 'nav-click', 'logout'])

const isUserMenuOpen = ref(false)
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}
const onLogout = () => {
  isUserMenuOpen.value = false
  emit('logout')
}

const onWindowClick = () => {
  isUserMenuOpen.value = false
}
onMounted(() => {
  window.addEventListener('click', onWindowClick)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', onWindowClick)
})
</script>

<style scoped>
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}

.logo-highlight {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: #888;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: #fff;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #7b2cbf);
  border-radius: 1px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box input {
  width: 240px;
  height: 38px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 19px;
  padding: 0 40px 0 40px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.3s;
}

.search-box input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
}

.search-box input::placeholder {
  color: #666;
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  color: #666;
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 12px;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-clear:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.user-avatar svg {
  width: 20px;
  height: 20px;
  color: #fff;
}

.user-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 140px;
  background: rgba(18, 18, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  z-index: 200;
}

.user-menu-item {
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  text-align: left;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
}

.user-menu-item:hover {
  background: rgba(255, 107, 107, 0.12);
  color: #ffb3b3;
}

@media (max-width: 1200px) {
  .top-nav { padding: 0 24px; }
  .nav-links { display: none; }
}

@media (max-width: 768px) {
  .search-box input { width: 160px; }
}
</style>
