<template>
  <div class="hero" v-if="apps.length > 0">
    <div class="hero-slides" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
      <div
        v-for="app in apps"
        :key="app.app_id"
        class="hero-slide"
        :style="{ backgroundImage: `url(${getAppImage(app)})` }"
      >
        <div class="hero-mask" />
        <div class="hero-content">
          <div class="hero-tag">热门推荐</div>
          <h2 class="hero-title">{{ app.title }}</h2>
          <p class="hero-desc">立即体验云端畅玩，无需下载，即点即玩</p>
          <div class="hero-badges">
            <span v-if="app.is_hdr_supported" class="badge-hdr">HDR</span>
            <span class="badge-res">4K</span>
            <span class="badge-fps">60FPS</span>
          </div>
          <button class="hero-play-btn" @click="$emit('play', app)">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            立即游玩
          </button>
        </div>
      </div>
    </div>

    <!-- 左右箭头 -->
    <button class="hero-arrow left" @click="prev">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>
    <button class="hero-arrow right" @click="next">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
      </svg>
    </button>

    <!-- 指示点 -->
    <div class="hero-dots">
      <span
        v-for="(app, i) in apps"
        :key="app.app_id"
        class="hero-dot"
        :class="{ active: i === currentIndex }"
        @click="goTo(i)"
      />
    </div>
  </div>

  <!-- 骨架屏 -->
  <div class="hero hero-skeleton" v-else-if="loading">
    <div class="skeleton-shimmer" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  apps: {
    type: Array,
    default: () => []
  },
  appImages: {
    type: Map,
    default: () => new Map()
  },
  loading: {
    type: Boolean,
    default: false
  },
  autoplay: {
    type: Boolean,
    default: true
  },
  interval: {
    type: Number,
    default: 5000
  }
})

const emit = defineEmits(['play'])

const currentIndex = ref(0)
let timer = null

const PALETTE = [
  ['#0f0c29', '#302b63', '#24243e'],
  ['#1a1a2e', '#16213e', '#0f3460'],
  ['#2d1b69', '#11998e', '#38ef7d'],
  ['#0f2027', '#203a43', '#2c5364'],
  ['#360033', '#0b8793', '#36d1dc'],
]

function gradientFromTitle(title, w, h) {
  const idx = Math.abs(title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETTE.length
  const [c1, c2, c3] = PALETTE[idx]
  const letter = title.charAt(0).toUpperCase()
  const fs = Math.floor(Math.min(w, h) * 0.38)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="50%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <text x="${w / 2}" y="${h / 2}" font-family="Arial Black,Arial" font-weight="900"
      font-size="${fs}" fill="rgba(255,255,255,0.15)"
      text-anchor="middle" dominant-baseline="middle">${letter}</text>
    <text x="${w / 2}" y="${h * 0.72}" font-family="Arial" font-size="${Math.floor(w * 0.075)}"
      fill="rgba(255,255,255,0.55)" text-anchor="middle">${title}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function getAppImage(app) {
  return props.appImages.get(app.app_id) || gradientFromTitle(app.title, 1200, 500)
}

function next() {
  if (props.apps.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % props.apps.length
}

function prev() {
  if (props.apps.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + props.apps.length) % props.apps.length
}

function goTo(index) {
  currentIndex.value = index
}

function startAutoplay() {
  if (props.autoplay && props.interval > 0) {
    timer = setInterval(next, props.interval)
  }
}

function stopAutoplay() {
  clearInterval(timer)
}

watch(() => props.apps, () => {
  currentIndex.value = 0
}, { deep: true })

onMounted(() => startAutoplay())
onUnmounted(() => stopAutoplay())
</script>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 520px;
  overflow: hidden;
  margin-top: 64px;
  background: #0a0a0f;
}

.hero-skeleton {
  height: 520px;
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #1a1a2e 25%, #2a2a3e 50%, #1a1a2e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.hero-slides {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.hero-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(10, 10, 15, 0.95) 0%,
    rgba(10, 10, 15, 0.6) 40%,
    rgba(10, 10, 15, 0.2) 100%
  );
}

.hero-content {
  position: absolute;
  bottom: 100px;
  left: 80px;
  z-index: 1;
  max-width: 500px;
}

.hero-tag {
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.hero-title {
  font-size: 48px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  margin: 0 0 12px;
  line-height: 1.1;
}

.hero-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px;
  line-height: 1.5;
}

.hero-badges {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.badge-hdr {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.badge-res,
.badge-fps {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-play-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 36px;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.hero-play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 212, 255, 0.5);
}

.hero-play-btn svg {
  width: 24px;
  height: 24px;
}

.hero-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: all 0.3s;
}

.hero-arrow:hover {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.hero-arrow svg {
  width: 28px;
  height: 28px;
}

.hero-arrow.left { left: 30px; }
.hero-arrow.right { right: 30px; }

.hero-dots {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 2;
}

.hero-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.3s;
}

.hero-dot:hover {
  background: rgba(255, 255, 255, 0.5);
}

.hero-dot.active {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  width: 30px;
  border-radius: 5px;
}

@media (max-width: 1200px) {
  .hero-content { left: 40px; bottom: 80px; }
  .hero-title { font-size: 36px; }
}

@media (max-width: 768px) {
  .hero { height: 400px; }
  .hero-content { left: 24px; bottom: 60px; }
  .hero-title { font-size: 28px; }
  .hero-desc { font-size: 14px; }
}
</style>
