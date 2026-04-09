<template>
  <div class="host-list-container">
    <!-- 顶部栏 -->
    <div class="host-list-header">
      <div class="header-title">
        <svg class="title-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
        </svg>
        <h2>选择游戏主机</h2>
      </div>
      <div class="header-actions">
        <span class="user-info" v-if="user">欢迎, {{ user.name || '用户' }}</span>
        <button class="btn-refresh" @click="$emit('refresh')" title="刷新">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <button class="btn-logout" @click="$emit('logout')">退出登录</button>
      </div>
    </div>

    <!-- 主机网格 -->
    <div class="hosts-grid" v-if="hosts.length > 0">
      <div
        v-for="host in hosts"
        :key="host.host_id"
        class="host-card"
        :class="(host.server_state || 'offline').toLowerCase()"
        @click="$emit('select', host)"
      >
        <div class="host-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
          </svg>
        </div>
        <div class="host-info">
          <h3>{{ host.name }}</h3>
          <p class="host-address">{{ host.address }}</p>
          <span class="host-status" :class="(host.server_state || 'offline').toLowerCase()">
            {{ getStatusText(host.server_state) }}
          </span>
        </div>
        <div class="host-arrow">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 空态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
        </svg>
      </div>
      <p>暂无可用主机</p>
      <button class="btn-refresh-empty" @click="$emit('refresh')">刷新列表</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hosts: {
    type: Array,
    default: () => []
  },
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['select', 'logout', 'refresh'])

function getStatusText(state) {
  const statusMap = {
    'Online': '在线',
    'Busy': '忙碌',
    'Offline': '离线'
  }
  return statusMap[state] || '离线'
}
</script>

<style scoped>
.host-list-container {
  padding-top: 64px;
}

.host-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 28px;
  height: 28px;
  color: #00d4ff;
}

.header-title h2 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  color: #888;
  font-size: 14px;
}

.btn-refresh {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

.btn-refresh svg {
  width: 20px;
  height: 20px;
}

.btn-logout {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
}

.hosts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.host-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.host-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.host-card.offline {
  opacity: 0.6;
}

.host-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  border-radius: 12px;
  flex-shrink: 0;
}

.host-icon svg {
  width: 28px;
  height: 28px;
  color: #fff;
}

.host-info {
  flex: 1;
  min-width: 0;
}

.host-info h3 {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
}

.host-address {
  color: #666;
  font-size: 13px;
  margin: 0 0 10px;
}

.host-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.host-status.online {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.host-status.busy {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.host-status.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.host-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s;
}

.host-card:hover .host-arrow {
  color: #00d4ff;
}

.host-arrow svg {
  width: 24px;
  height: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #555;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  color: #333;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 20px;
}

.btn-refresh-empty {
  padding: 10px 24px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  color: #00d4ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh-empty:hover {
  background: rgba(0, 212, 255, 0.2);
}

@media (max-width: 768px) {
  .host-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .hosts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
