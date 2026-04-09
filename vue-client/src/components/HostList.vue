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
        <button class="btn-add" @click="openAddModal">添加主机</button>
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
        <button class="btn-delete" title="删除主机" @click.stop="onDelete(host)">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/>
          </svg>
        </button>
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
      <div class="empty-actions">
        <button class="btn-refresh-empty" @click="$emit('refresh')">刷新列表</button>
        <button class="btn-add-empty" @click="openAddModal">添加主机</button>
      </div>
    </div>

    <teleport to="body">
      <div v-if="isAddModalOpen" class="modal-backdrop" @click.self="closeAddModal">
        <div class="modal">
          <div class="modal-header">
            <h3>添加主机</h3>
            <button class="modal-close" @click="closeAddModal">×</button>
          </div>
          <div class="modal-body">
            <label class="field">
              <span>地址</span>
              <input v-model.trim="addForm.address" placeholder="例如：192.168.1.50" />
            </label>
            <label class="field">
              <span>端口</span>
              <input v-model.trim="addForm.httpPort" inputmode="numeric" placeholder="例如：47989" />
            </label>
            <label class="field">
              <span>PIN（可选）</span>
              <input v-model.trim="addForm.pin" inputmode="numeric" placeholder="例如：1234" />
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeAddModal">取消</button>
            <button class="btn-primary" :disabled="!addForm.address" @click="submitAddHost">添加</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

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

const emit = defineEmits(['select', 'logout', 'refresh', 'add-host', 'delete'])

function getStatusText(state) {
  const statusMap = {
    'Online': '在线',
    'Busy': '忙碌',
    'Offline': '离线'
  }
  return statusMap[state] || '离线'
}

const isAddModalOpen = ref(false)
const addForm = reactive({ address: '', httpPort: '', pin: '' })

const openAddModal = () => {
  addForm.address = ''
  addForm.httpPort = ''
  addForm.pin = ''
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const submitAddHost = () => {
  const address = addForm.address?.trim()
  if (!address) return
  const httpPort = addForm.httpPort?.trim()
  const port = httpPort ? Number.parseInt(httpPort, 10) : null
  const pin = addForm.pin?.trim() || null
  emit('add-host', { address, http_port: Number.isFinite(port) ? port : null, pin })
  closeAddModal()
}

const onDelete = (host) => {
  emit('delete', host)
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

.btn-add {
  padding: 8px 14px;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.22);
  border-radius: 8px;
  color: #baf3ff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: rgba(0, 212, 255, 0.18);
  border-color: rgba(0, 212, 255, 0.35);
  color: #fff;
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
  position: relative;
}

.btn-delete {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: rgba(255, 107, 107, 0.12);
  border-color: rgba(255, 107, 107, 0.25);
  color: #ff8d8d;
}

.btn-delete svg {
  width: 18px;
  height: 18px;
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

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
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

.btn-add-empty {
  padding: 10px 18px;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.22);
  color: #baf3ff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-empty:hover {
  background: rgba(0, 212, 255, 0.18);
  border-color: rgba(0, 212, 255, 0.35);
  color: #fff;
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

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.modal-body {
  padding: 16px 18px;
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
}

.field input {
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
  outline: none;
}

.field input:focus {
  border-color: rgba(0, 212, 255, 0.35);
  background: rgba(0, 212, 255, 0.06);
}

.modal-actions {
  padding: 14px 18px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-secondary {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
}

.btn-primary {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 212, 255, 0.25);
  background: rgba(0, 212, 255, 0.14);
  color: #d7faff;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
