<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { PRESET_GROUPS, PRESETS } from '../lib/presets'
import { TOOL_LABELS } from '../lib/constants'
import { useWorksStore } from '../stores/works'
import { useAuthStore } from '../stores/auth'
import { createGeneration } from '../api/generations'

const router = useRouter()
const works = useWorksStore()
const auth = useAuthStore()

const prompt = ref('')
const submitting = ref(false)
const activeGroup = ref('all')
const keyword = ref('')

const GROUP_COVER = {
  image: 'linear-gradient(135deg,#1e3a5f,#0e7490)',
  copy: 'linear-gradient(135deg,#3b2f5f,#6d28d9)',
  video: 'linear-gradient(135deg,#5f3a1e,#ea580c)',
  edit: 'linear-gradient(135deg,#2b313d,#4b5563)'
}

onMounted(async () => {
  if (!auth.isLoggedIn) return
  try {
    await works.loadWorks()
  } catch {
    // 后端未接入时保留空态
  }
})

const filtered = computed(() =>
  PRESETS.filter((p) => {
    if (activeGroup.value !== 'all' && p.group !== activeGroup.value) return false
    if (keyword.value) {
      const k = keyword.value.toLowerCase()
      return (
        p.title.toLowerCase().includes(k) || p.description.toLowerCase().includes(k)
      )
    }
    return true
  })
)

const recent = computed(() => works.list.slice(0, 4))

function toolLabel(item) {
  const slug = item.toolSlug || item.tool_slug
  return TOOL_LABELS[slug] || slug || '作品'
}

function isVideo(item) {
  return (item.toolSlug || item.tool_slug) === 'text-to-video'
}

function isMock(item) {
  return typeof item.resultUrl === 'string' && item.resultUrl.startsWith('mock://')
}

function hasMedia(item) {
  return Boolean(item.resultUrl) && !isMock(item)
}

function reuse(preset) {
  router.push({ path: `/tool/${preset.targetTool}`, query: { preset: preset.slug } })
}

async function onGenerate() {
  if (!auth.isLoggedIn) {
    ElMessage.info('请先登录后再使用工具')
    router.push({ name: 'login', query: { redirect: '/' } })
    return
  }
  if (!prompt.value.trim()) {
    ElMessage.warning('请填写提示词')
    return
  }
  submitting.value = true
  try {
    await createGeneration({
      tool_slug: 'text-to-image',
      params: { prompt: prompt.value, size: '1:1', n: 1 }
    })
    ElMessage.success('已提交生成，可在我的作品查看结果')
    prompt.value = ''
    await works.loadWorks()
  } catch (err) {
    ElMessage.error(err.message || '调用失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- 顶部创作卡片 -->
  <section class="hero-card">
    <div class="upload-box">
      <el-icon class="upload-plus"><Plus /></el-icon>
      <span class="count">0/10</span>
    </div>
    <div class="hero-main">
      <el-input
        v-model="prompt"
        type="textarea"
        :rows="3"
        resize="none"
        placeholder="万能出图，写什么就出什么，大白话，具体讲清楚要求，AI 没有读心术，你没写的东西它有概率随机改"
      />
      <div class="hero-bar">
        <div class="chips">
          <span class="chip">个人仓库</span>
          <span class="chip">万能出图 Agent</span>
          <span class="chip">重点 VT</span>
          <span class="chip">随机比例 2K</span>
        </div>
        <div class="hero-right">
          <span class="muted">消耗 2 积分</span>
          <el-button type="primary" :loading="submitting" @click="onGenerate">生成</el-button>
        </div>
      </div>
    </div>
  </section>

  <!-- 最近项目（次要区块） -->
  <section class="section">
    <div class="section-head">
      <h2>最近项目</h2>
      <router-link v-if="auth.isLoggedIn" to="/works" class="more">查看全部 ›</router-link>
    </div>
    <el-empty
      v-if="!auth.isLoggedIn"
      description="登录后即可查看并继续你的最近创作项目"
    />
    <div v-else class="recent-grid">
      <button class="recent-add" @click="router.push('/tools')">
        <el-icon><Plus /></el-icon>
        <span>开始创作</span>
      </button>
      <el-card v-for="item in recent" :key="item.id" class="recent-card">
        <video v-if="isVideo(item) && hasMedia(item)" :src="item.resultUrl" controls class="r-thumb" />
        <el-image
          v-else-if="item.resultUrl && !isMock(item)"
          :src="item.resultUrl"
          fit="cover"
          class="r-thumb"
        />
        <pre v-else-if="item.resultText" class="r-thumb text">{{ item.resultText }}</pre>
        <div v-else class="r-thumb placeholder">生成结果占位</div>
        <div class="recent-meta muted">{{ toolLabel(item) }}</div>
      </el-card>
    </div>
  </section>

  <!-- 模板市场 -->
  <section class="section">
    <div class="section-head">
      <h2>模板市场</h2>
      <el-input v-model="keyword" class="search" :prefix-icon="Search" placeholder="搜索模板..." />
    </div>

    <div class="caps">
      <button class="cap" :class="{ on: activeGroup === 'all' }" @click="activeGroup = 'all'">全部</button>
      <button
        v-for="g in PRESET_GROUPS"
        :key="g.key"
        class="cap"
        :class="{ on: activeGroup === g.key }"
        @click="activeGroup = g.key"
      >
        {{ g.label }}
      </button>
    </div>

    <el-empty v-if="!filtered.length" description="没有匹配的模板" />
    <div v-else class="tpl-grid">
      <el-card v-for="p in filtered" :key="p.slug" class="tpl-card">
        <div class="cover" :style="{ background: GROUP_COVER[p.group] }">
          <span class="cover-icon">{{ p.icon }}</span>
          <span class="badge" :class="p.badge ? 'badge-pending' : 'badge-new'">
            {{ p.badge || '上新' }}
          </span>
        </div>
        <div class="tpl-body">
          <h3>{{ p.title }}</h3>
          <p class="desc muted">{{ p.description }}</p>
          <el-button size="small" type="primary" plain class="use" @click="reuse(p)">使用模板</el-button>
        </div>
      </el-card>
    </div>
  </section>
</template>

<style scoped>
/* 顶部创作卡片 */
.hero-card {
  display: flex;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}

.upload-box {
  width: 84px;
  height: 84px;
  flex-shrink: 0;
  border: 1px dashed var(--border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--muted);
}

.upload-plus {
  font-size: 22px;
}

.count {
  font-size: 12px;
}

.hero-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  font-size: 12px;
  color: var(--muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 5px 12px;
}

.hero-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 区块通用 */
.section {
  margin-top: 32px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-head h2 {
  font-size: 18px;
  margin: 0;
}

.more {
  color: var(--muted);
  font-size: 13px;
  text-decoration: none;
}

.search {
  width: 240px;
}

/* 最近项目 */
.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.recent-add {
  border: 1px dashed var(--border);
  background: transparent;
  border-radius: 12px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--muted);
  cursor: pointer;
  font-size: 14px;
}

.recent-add:hover {
  border-color: var(--brand);
  color: var(--text);
}

.recent-card {
  padding: 0;
  overflow: hidden;
}

.r-thumb {
  width: 100%;
  height: 130px;
  border-radius: 8px;
  background: var(--surface-3);
}

.r-thumb.text {
  white-space: pre-wrap;
  font-size: 12px;
  overflow: hidden;
  margin: 0;
  padding: 8px;
  color: var(--text);
}

.r-thumb.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-size: 12px;
}

.recent-meta {
  margin-top: 8px;
  font-size: 12px;
}

/* 模板市场 */
.caps {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.cap {
  font-size: 13px;
  color: var(--muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
}

.cap.on {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.tpl-card {
  overflow: hidden;
  padding: 0;
}

.cover {
  position: relative;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 40px;
}

.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 11px;
  border-radius: 6px;
  padding: 2px 8px;
}

.badge-new {
  background: #f97316;
  color: #fff;
}

.badge-pending {
  background: rgba(0, 0, 0, 0.45);
  color: #e5e7eb;
}

.tpl-body {
  padding: 14px;
}

.tpl-body h3 {
  margin: 0 0 6px;
  font-size: 15px;
}

.desc {
  font-size: 12px;
  min-height: 34px;
  margin: 0 0 12px;
  line-height: 1.5;
}

.use {
  width: 100%;
}

@media (max-width: 768px) {
  .hero-card {
    flex-direction: column;
  }
  .search {
    width: 100%;
  }
}
</style>
