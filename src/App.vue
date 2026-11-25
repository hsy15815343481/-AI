<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { House, Folder, Share, User, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from './stores/auth'
import CreditBadge from './components/CreditBadge.vue'
import SidebarQuickTools from './components/SidebarQuickTools.vue'
import { BRAND } from './lib/constants'

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
    <div class="shell">
      <!-- 顶部品牌横幅 -->
      <header class="banner">
        <div class="container banner-inner">
          <div class="brand">
            <span class="logo-dot" />
            <span class="brand-name">{{ BRAND.name }}</span>
          </div>
          <div class="slogan">{{ BRAND.slogan }}</div>
        </div>
      </header>

      <div class="layout">
        <!-- 左侧深色工具栏 -->
        <aside class="sidebar">
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

          <SidebarQuickTools class="side-quick" />

          <div class="side-foot">
            <span v-if="auth.isLoggedIn" class="user-name">
              {{ auth.user?.nickname || '已登录' }}
            </span>
            <el-button v-else size="small" type="primary" plain @click="router.push('/login')">
              登录
            </el-button>
          </div>
        </aside>

        <!-- 主内容区 -->
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
              © {{ year }} {{ BRAND.name }} · <router-link to="/legal">用户协议与隐私说明</router-link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

/* 顶部横幅 */
.banner {
  background: var(--banner-bg);
  color: var(--banner-text);
}

.banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 20px;
  padding-bottom: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 26px;
}

.logo-dot {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--brand-gradient);
  flex-shrink: 0;
}

.slogan {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.85;
}

/* 布局 */
.layout {
  display: flex;
  min-height: calc(100vh - 76px);
}

/* 深色侧栏 */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #12151b;
  border-right: 1px solid #2a2f3a;
  position: sticky;
  top: 0;
  height: calc(100vh - 76px);
  overflow-y: auto;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 11px 12px;
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
  color: #98a0ad;
  text-decoration: none;
  font-size: 14px;
  padding: 10px 12px;
  border-radius: 8px;
}

.nav-link .nav-icon {
  font-size: 16px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #eceef1;
}

.nav-link.active {
  color: #22d3ee;
  background: rgba(255, 255, 255, 0.08);
}

.side-quick {
  flex: 1;
  overflow-y: auto;
}

.side-foot {
  margin-top: auto;
  padding: 10px 6px 0;
}

.user-name {
  font-size: 13px;
  color: #98a0ad;
}

/* 主区 */
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
    border-bottom: 1px solid #2a2f3a;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .side-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .side-quick {
    flex: 1 1 100%;
  }
  .side-foot {
    margin-top: 0;
  }
}
</style>
