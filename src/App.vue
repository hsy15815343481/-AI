<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAuthStore } from './stores/auth'
import CreditBadge from './components/CreditBadge.vue'

const auth = useAuthStore()
const router = useRouter()

const nav = [
  { to: '/', label: '首页' },
  { to: '/tools', label: '工具' },
  { to: '/workflow', label: '工作流' },
  { to: '/works', label: '我的作品' },
  { to: '/profile', label: '个人中心' }
]

const onLogout = () => {
  auth.logout()
  router.push('/')
}

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <el-config-provider :locale="zhCn">
  <header class="nav">
    <div class="container nav-inner">
      <router-link to="/" class="brand">AI 工具箱</router-link>
      <nav class="links">
        <router-link v-for="item in nav" :key="item.to" :to="item.to">{{ item.label }}</router-link>
      </nav>
      <div class="actions">
        <CreditBadge />
        <template v-if="auth.isLoggedIn">
          <el-button size="small" @click="onLogout">退出</el-button>
        </template>
        <el-button v-else size="small" type="primary" @click="router.push('/login')">登录</el-button>
      </div>
    </div>
  </header>

  <main class="container">
    <router-view />
  </main>

  <footer class="footer">
    <div class="container muted">
      © {{ year }} AI 工具箱 MVP · <router-link to="/legal">用户协议与隐私说明</router-link>
    </div>
  </footer>
  </el-config-provider>
</template>

<style scoped>
.nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.nav-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 56px;
}
.brand {
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
}
.links {
  display: flex;
  gap: 16px;
  flex: 1;
}
.links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
}
.links a.router-link-active {
  color: var(--brand);
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.footer {
  margin-top: 48px;
  padding: 20px 0;
}
</style>
