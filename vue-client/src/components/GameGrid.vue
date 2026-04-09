<template>
  <section class="game-section" v-if="apps.length > 0">
    <div class="section-header">
      <div class="section-title-wrap">
        <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
        <h3 class="section-title">{{ title }}</h3>
        <span class="section-count">{{ apps.length }} 款</span>
      </div>
    </div>
    <div class="game-grid">
      <div
        v-for="app in apps"
        :key="app.app_id"
        class="game-card"
        @click="$emit('play', app)"
      >
        <div class="card-cover">
          <img
            :src="getAppImage(app)"
            :alt="app.title"
            @error="onImgError($event, app)"
          />
          <div class="card-overlay">
            <div class="play-circle">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <span v-if="app.is_hdr_supported" class="badge-hdr card-hdr">HDR</span>
        </div>
        <div class="card-footer">
          <p class="card-name">{{ app.title }}</p>
          <p class="card-tags">{{ getTags(app) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  apps: {
    type: Array,
    default: () => []
  },
  appImages: {
    type: Map,
    default: () => new Map()
  },
  title: {
    type: String,
    default: '全部游戏'
  }
})

const emit = defineEmits(['play'])

const PALETTE = [
  ['#0f0c29', '#302b63', '#24243e'],
  ['#1a1a2e', '#16213e', '#0f3460'],
  ['#2d1b69', '#11998e', '#38ef7d'],
  ['#0f2027', '#203a43', '#2c5364'],
  ['#360033', '#0b8793', '#36d1dc'],
  ['#1f4037', '#99f2c8', '#56ab2f'],
  ['#373b44', '#4286f4', '#373b44'],
  ['#1a1a1a', '#c0392b', '#e74c3c'],
  ['#141e30', '#243b55', '#6a85b6'],
]

const TAGS = ['动作', '冒险', 'RPG', '射击', '策略', '竞速', '体育', '模拟']

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
  return props.appImages.get(app.app_id) || gradientFromTitle(app.title, 220, 300)
}

function onImgError(event, app) {
  event.target.src = gradientFromTitle(app.title, 220, 300)
}

function getTags(app) {
  // 根据 app_id 生成固定的标签组合
  const idx = app.app_id % TAGS.length
  return `${TAGS[idx]} · ${TAGS[(idx + 1) % TAGS.length]}`
}
</script>

<style scoped>
.game-section {
  margin-bottom: 48px;
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

.section-count {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.game-card {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-card:hover {
  transform: translateY(-8px);
  border-color: rgba(0, 212, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 255, 0.1);
}

.card-cover {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #12131a;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s;
}

.game-card:hover .card-cover img {
  transform: scale(1.08);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.game-card:hover .card-overlay {
  opacity: 1;
}

.play-circle {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
  transition: transform 0.3s;
}

.play-circle:hover {
  transform: scale(1.1);
}

.play-circle svg {
  width: 28px;
  height: 28px;
  color: #fff;
  margin-left: 4px;
}

.badge-hdr {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.card-hdr {
  position: absolute;
  top: 10px;
  right: 10px;
  margin: 0;
}

.card-footer {
  padding: 14px;
}

.card-name {
  margin: 0 0 6px;
  font-size: 14px;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  margin: 0;
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }
}
</style>
