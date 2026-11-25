<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { House, Folder, Share, User, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import CreditBadge from './components/CreditBadge.vue'

const auth = useAuthStore()
const router = useRouter()

const nav = [
  { to: '/', label: '首页', icon: House },
  { to: '/works', label: '我的作品', icon: Folder },
  { to: '/workflow', label: '工作流', icon: Share },
  { to: '/profile', label: '个人中心', icon: User }
]

const onLogout = () => {
  auth.logout()
  router.push('/')
}

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="layout">
      <aside class="sidebar">
        <router-link to="/" class="brand">
          <span class="logo-dot" />
          <span class="brand-name">秋挽AI</span>
        </router-link>

        <button class="new-btn" @click="router.push('/')">
          <el-icon><Plus /></el-icon>
          <span>新建项目</span>
        </button>

        <nav class="side-nav">
          <router-link
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            exact-active-class="active"
          >
            <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <div class="side-foot">
          <template v-if="auth.isLoggedIn">
            <span class="user-name">{{ auth.user?.nickname || '已登录' }}</span>
          </template>
          <el-button v-else size="small" type="primary" plain @click="router.push('/login')">
            登录
          </el-button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="container topbar-inner">
            <div class="spacer" />
            <div class="actions">
              <CreditBadge />
              <el-button v-if="auth.isLoggedIn" size="small" @click="onLogout">退出</el-button>
            </div>
          </div>
        </header>

        <main class="container page-body">
          <router-view />
        </main>

        <footer class="footer">
          <div class="container muted">
            © {{ year }} 秋挽AI · <router-link to="/legal">用户协议与隐私说明</router-link>
          </div>
        </footer>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 210px;
  flex-shrink: 0;
  background: var(--bg-2);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  font-size: 18px;
  padding: 2px 6px;
}

.logo-dot {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--brand-gradient);
  flex-shrink: 0;
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: var(--brand-gradient);
  cursor: pointer;
}

.new-btn:hover {
  filter: brightness(1.1);
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  padding: 10px 12px;
  border-radius: 8px;
}

.nav-link .nav-icon {
  font-size: 16px;
}

.nav-link:hover {
  background: var(--surface-2);
  color: var(--text);
}

.nav-link.active {
  color: var(--brand-2);
  background: var(--surface-2);
}

.side-foot {
  margin-top: auto;
  padding: 10px 6px 0;
}

.user-name {
  font-size: 13px;
  color: var(--muted);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  border-bottom: 1px solid var(--border);
  background: var(--bg-2);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner {
  display: flex;
  align-items: center;
  height: 56px;
}

.spacer {
  flex: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-body {
  padding-top: 20px;
}

.footer {
  margin-top: 48px;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    position: static;
    border-right: none;
    border-bottom: 1px solid var(--border);
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
  .side-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .side-foot {
    margin-top: 0;
  }
}
</style>
