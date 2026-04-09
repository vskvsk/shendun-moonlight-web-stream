<template>
  <div class="login-screen">
    <div class="login-box">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="loginLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7b2cbf"/>
            </linearGradient>
          </defs>
          <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#loginLogoGrad)"/>
          <polygon points="20,18 20,30 30,24" fill="#fff"/>
        </svg>
        <h1>Moon<span class="highlight">Game</span></h1>
      </div>
      <p class="subtitle">基于 Moonlight Web 技术</p>

      <div class="form-group">
        <input
          type="text"
          :value="username"
          @input="$emit('update:username', $event.target.value)"
          placeholder="用户名"
          @keyup.enter="$emit('login')"
        />
      </div>

      <div class="form-group">
        <input
          type="password"
          :value="password"
          @input="$emit('update:password', $event.target.value)"
          placeholder="密码"
          @keyup.enter="$emit('login')"
        />
      </div>

      <button class="btn-primary" @click="$emit('login')" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <p class="error-msg" v-if="error">{{ error }}</p>

      <div class="guest-login">
        <button class="btn-text" @click="$emit('guest')">
          游客访问
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  username: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

defineEmits(['update:username', 'update:password', 'login', 'guest'])
</script>

<style scoped>
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 48px;
  height: 48px;
}

.logo h1 {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.highlight {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  transition: all 0.3s;
  outline: none;
}

.form-group input:focus {
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
}

.form-group input::placeholder {
  color: #555;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 212, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #ff6b6b;
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}

.guest-login {
  text-align: center;
  margin-top: 24px;
}

.btn-text {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.btn-text:hover {
  color: #00d4ff;
}

@media (max-width: 480px) {
  .login-box {
    margin: 20px;
    padding: 36px 24px;
  }
}
</style>
