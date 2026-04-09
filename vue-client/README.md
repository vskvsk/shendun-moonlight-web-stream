# Moonlight Vue Client

基于 Vue 3 + Moonlight Web 的云游戏客户端。

## 功能特性

- 用户登录/游客访问
- 游戏主机管理
- 游戏库浏览
- 云游戏串流（基于 Moonlight Web）
- 自定义分辨率、帧率、码率
- 全屏/窗口模式
- 鼠标锁定（支持 3D 游戏）
- 游戏手柄支持
- 实时统计信息显示
- 移动端虚拟键盘

## 项目结构

```
moonlight-vue-client/
├── index.html              # 入口 HTML
├── package.json            # 项目依赖
├── vite.config.js          # Vite 配置
├── README.md               # 项目说明
└── src/
    ├── main.js             # 应用入口
    ├── App.vue             # 主组件
    ├── config/
    │   └── moonlight.js    # Moonlight 配置
    ├── services/
    │   ├── api.js          # API 服务
    │   └── streamService.js # 流服务封装
    └── components/
        └── GameStream.vue  # 游戏流组件
```

## 快速开始

### 1. 安装依赖

```bash
cd moonlight-vue-client
npm install
```

### 2. 配置 Moonlight Web 路径

编辑 `vite.config.js`，确保 `@moonlight` 别名指向正确的 Moonlight Web 目录：

```javascript
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
    '@moonlight': resolve(__dirname, '../moonlight-web-stream-file')
  }
}
```

### 3. 配置后端 API 地址

编辑 `src/config/moonlight.js`：

```javascript
export const MOONLIGHT_CONFIG = {
  apiBaseUrl: '',  // 如果你的 API 有前缀路径，填写在这里
  defaultSettings: {
    // 修改默认流设置
    bitrate: 20000,
    fps: 60,
    videoSize: '1080p',
    videoCodec: 'h264'
  }
}
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist/` 目录。

## 配置代理

如果后端服务在不同端口/域名，修改 `vite.config.js`：

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://your-moonlight-server:8080',
      changeOrigin: true
    },
    '/host/stream': {
      target: 'ws://your-moonlight-server:8080',
      ws: true
    }
  }
}
```

## 使用方式

### 作为独立应用

直接访问首页，登录后选择主机和游戏即可开始。

### 作为组件嵌入其他项目

```vue
<template>
  <GameStream
    :host-id="1"
    :app-id="2"
    :settings="streamSettings"
    @connected="onConnected"
    @disconnected="onDisconnected"
    @error="onError"
    @ready="onReady"
  />
</template>

<script setup>
import GameStream from '@/components/GameStream.vue'

const streamSettings = {
  bitrate: 20000,
  fps: 60,
  videoSize: '1080p',
  videoCodec: 'h264'
}

const onConnected = () => console.log('已连接')
const onDisconnected = () => console.log('已断开')
const onError = (e) => console.error('错误:', e)
const onReady = () => console.log('准备就绪')
</script>
```

### 通过 URL 参数直接启动

你可以修改 `App.vue` 或直接访问：

```
http://localhost:3000/?hostId=1&appId=2
```

添加启动参数解析：

```javascript
// 在 App.vue 的 onMounted 中添加
const urlParams = new URLSearchParams(window.location.search)
const hostId = urlParams.get('hostId')
const appId = urlParams.get('appId')

if (hostId && appId) {
  selectedHost.value = { host_id: parseInt(hostId) }
  selectedApp.value = { app_id: parseInt(appId) }
  isStreaming.value = true
}
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + Shift + F | 切换全屏 |
| Ctrl + Shift + I | 退出全屏/指针锁定（默认） |
| ESC (长按) | 退出全屏 |

## 注意事项

1. **浏览器兼容性**: 需要现代浏览器，支持 WebRTC、WebSocket、Gamepad API。

2. **HTTPS**: 生产环境必须使用 HTTPS，否则某些功能（如指针锁定、键盘锁定）无法使用。

3. **WebAssembly**: Moonlight Web 依赖 opus 解码器（WebAssembly），确保服务器正确配置 MIME 类型。

4. **CORS**: 确保 Moonlight 后端配置了正确的 CORS 头。

## 技术栈

- Vue 3 (Composition API)
- Vite 5
- Moonlight Web (stream + input + video + audio)
- WebRTC / WebSocket
- WebCodecs API

## 许可证

MIT
