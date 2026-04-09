<template>
  <section class="ranking-section" v-if="apps.length > 0">
    <div class="section-header">
      <div class="section-title-wrap">
        <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
        </svg>
        <h3 class="section-title">热玩排行</h3>
      </div>
      <a href="#" class="section-more" @click.prevent="$emit('view-more')">查看更多 →</a>
    </div>
    <div class="ranking-list">
      <div
        v-for="(app, index) in displayApps"
        :key="app.app_id"
        class="ranking-item"
        @click="$emit('play', app)"
      >
        <div class="rank-number" :class="{ 'top-3': index < 3 }">{{ index + 1 }}</div>
        <div class="rank-cover">
          <img :src="getAppImage(app)" :alt="app.title" />
        </div>
        <div class="rank-info">
          <h4 class="rank-name">{{ app.title }}</h4>
          <p class="rank-players">{{ getRandomPlayers() }}人在玩</p>
        </div>
        <button class="rank-play-btn" @click.stop="$emit('play', app)">立即玩</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  apps: {
    type: Array,
    default: () => []
  },
  appImages: {
    type: Map,
    default: () => new Map()
  },
  limit: {
    type: Number,
    default: 6
  }
})

const emit = defineEmits(['play', 'view-more'])

const displayApps = computed(() => props.apps.slice(0, props.limit))

const PALETTE = [
  ['#0f0c29', '#302b63', '#24243e'],
  ['#1a1a2e', '#16213e', '#0f3460'],
  ['#2d1b69', '#11998e', '#38ef7d'],
  ['#0f2027', '#203a43', '#2c5364'],
  ['#360033', '#0b8793', '#36d1dc'],
  ['#1f4037', '#99f2c8', '#56ab2f'],
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
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function getAppImage(app) {
  return props.appImages.get(app.app_id) || gradientFromTitle(app.title, 220, 300)
}

function getRandomPlayers() {
  return Math.floor(Math.random() * 50000) + 1000
}
</script>

<style scoped>
.ranking-section {
  margin-bottom: 56px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  width: 24px;
  height: 24px;
  color: #00d4ff;
}

.section-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.section-more {
  color: #888;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s;
}

.section-more:hover {
  color: #00d4ff;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.ranking-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.2);
  transform: translateX(8px);
}

.rank-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #888;
  flex-shrink: 0;
}

.rank-number.top-3 {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #1a1a1a;
}

.rank-cover {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.rank-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-players {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.rank-play-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid rgba(0, 212, 255, 0.5);
  border-radius: 20px;
  color: #00d4ff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.rank-play-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

@media (max-width: 768px) {
  .ranking-item { padding: 10px 14px; }
  .rank-cover { width: 48px; height: 64px; }
  .rank-name { font-size: 14px; }
}
</style>
