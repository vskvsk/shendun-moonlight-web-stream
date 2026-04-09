<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-brand">
        <svg class="footer-logo" viewBox="0 0 48 48" fill="none">
          <defs>
            <linearGradient id="footerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="100%" stop-color="#7b2cbf"/>
            </linearGradient>
          </defs>
          <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#footerLogoGrad)"/>
          <polygon points="20,18 20,30 30,24" fill="#fff"/>
        </svg>
        <span class="brand-text">Moon<span class="highlight">Game</span> 云游戏</span>
      </div>
      <div class="footer-links">
        <a href="#" @click.prevent>关于我们</a>
        <a href="#" @click.prevent>使用条款</a>
        <a href="#" @click.prevent>隐私政策</a>
        <a href="#" @click.prevent>帮助中心</a>
      </div>
      <p class="footer-copyright">© 2024 MoonGame. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 40px 60px;
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-logo {
  width: 32px;
  height: 32px;
}

.brand-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.highlight {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-links {
  display: flex;
  gap: 32px;
}

.footer-links a {
  color: #888;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #00d4ff;
}

.footer-copyright {
  color: #666;
  font-size: 13px;
  margin: 0;
}

@media (max-width: 768px) {
  .footer {
    padding: 32px 24px;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-links {
    gap: 20px;
  }
}
</style>
