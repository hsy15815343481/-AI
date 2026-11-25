<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAuthStore } from './stores/auth'
import { PRESET_GROUPS, presetsByGroup } from './lib/presets'
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

const goPreset = (preset) => {
  router.push({ path: `/tool/${preset.targetTool}`, query: { preset: preset.slug } })
}

const year = computed(() => new Date().getFullYear())
</script>

<template>
  <el-config-provider :locale="zhCn">
  <div class="layout">
    <aside class="sidebar">
      <router-link to="/" class="brand">AI 工具箱</router-link>

      <nav class="side-nav">
        <router-link v-for="item in nav" :key="item.to" :to="item.to" class="nav-link">
          {{ item.label }}
        </router-link>
      </nav>

      <div class="side-presets">
        <div v-for="group in PRESET_GROUPS" :key="group.key" class="preset-group">
          <div class="group-label">{{ group.label }}</div>
          <button
            v-for="p in presetsByGroup(group.key)"
            :key="p.slug"
            class="preset-item"
            :class="{ pending: p.badge }"
            @click="goPreset(p)"
          >
            <span class="icon">{{ p.icon }}</span>
            <span class="title">{{ p.title }}</span>
            <el-tag v-if="p.badge" size="small" type="info" class="badge">{{ p.badge }}</el-tag>
          </button>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="container topbar-inner">
          <div class="spacer" />
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
  width: 224px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding: 16px 12px;
}

.brand {
  display: block;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  font-size: 17px;
  padding: 4px 8px 16px;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 20px;
}

.nav-link {
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 6px;
}

.nav-link.router-link-active {
  color: var(--brand);
  background: #eff6ff;
}

.preset-group {
  margin-bottom: 16px;
}

.group-label {
  font-size: 12px;
  color: var(--muted);
  padding: 4px 10px;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.preset-item:hover {
  background: var(--bg);
}

.preset-item.pending .title {
  color: var(--muted);
}

.preset-item .icon {
  width: 20px;
  text-align: center;
}

.preset-item .title {
  flex: 1;
}

.preset-item .badge {
  transform: scale(0.85);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-inner {
  display: flex;
  align-items: center;
  height: 56px;
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
  }
  .side-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .preset-group {
    margin-right: 12px;
  }
}
</style>
