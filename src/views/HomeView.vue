<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TOOL_DEFS } from '../lib/constants'
import ToolCard from '../components/ToolCard.vue'
import { useWorksStore } from '../stores/works'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const works = useWorksStore()
const auth = useAuthStore()
const loading = ref(false)
const filter = ref('all')

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'text', label: '文案' }
]

const TOOL_LABELS = {
  'text-to-image': 'AI 绘画',
  copywriting: '文案生成',
  'text-to-video': 'AI 视频'
}

onMounted(async () => {
  if (!auth.isLoggedIn) return
  loading.value = true
  try {
    await works.loadWorks()
  } catch (err) {
    ElMessage.error(err.message || '作品加载失败')
  } finally {
    loading.value = false
  }
})

function kind(item) {
  if (item.toolSlug === 'text-to-video') return 'video'
  if (item.resultText) return 'text'
  return 'image'
}

function toolLabel(item) {
  return TOOL_LABELS[item.toolSlug] || item.toolSlug || '作品'
}

function isMock(item) {
  return typeof item.resultUrl === 'string' && item.resultUrl.startsWith('mock://')
}

function hasMedia(item) {
  return Boolean(item.resultUrl) && !isMock(item)
}

const filtered = computed(() =>
  works.list.filter((i) => filter.value === 'all' || kind(i) === filter.value)
)

function reuse(item) {
  const query = { ...(item.params || {}) }
  router.push({ path: `/tool/${item.toolSlug}`, query })
}
</script>

<template>
  <section class="hero">
    <h1>创作，只需要填几个参数</h1>
    <p class="muted">一站式 AI 工具 MVP：AI 绘画、文案生成、商品视频，登录后消耗积分调用。</p>
    <el-button type="primary" size="large" @click="$router.push('/tools')">开始创作</el-button>
  </section>

  <h2 class="page-title">热门工具</h2>
  <div class="grid">
    <ToolCard v-for="tool in TOOL_DEFS" :key="tool.slug" :tool="tool" />
  </div>

  <h2 class="page-title">作品展示</h2>
  <el-skeleton v-if="loading" :rows="3" animated />
  <el-empty
    v-else-if="!auth.isLoggedIn"
    description="登录后查看你的历史作品，并可一键复用提示词"
  >
    <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
  </el-empty>
  <template v-else>
    <el-radio-group v-model="filter" class="filter">
      <el-radio-button v-for="tab in TABS" :key="tab.key" :value="tab.key">{{ tab.label }}</el-radio-button>
    </el-radio-group>

    <el-empty v-if="!filtered.length" description="还没有作品，先去创作第一条吧" />
    <div class="grid works">
      <el-card v-for="item in filtered" :key="item.id" class="work">
        <video v-if="kind(item) === 'video' && hasMedia(item)" :src="item.resultUrl" controls class="thumb" />
        <el-image
          v-else-if="kind(item) === 'image' && item.resultUrl && !isMock(item)"
          :src="item.resultUrl"
          fit="contain"
          class="thumb"
        />
        <pre v-else-if="kind(item) === 'text' && item.resultText" class="thumb text">{{ item.resultText }}</pre>
        <div v-else class="thumb placeholder">生成结果占位（未接入真实模型）</div>

        <template #footer>
          <div class="foot">
            <span class="muted">{{ toolLabel(item) }}</span>
            <el-button size="small" type="primary" plain @click="reuse(item)">复用提示词</el-button>
          </div>
        </template>
      </el-card>
    </div>
  </template>
</template>

<style scoped>
.hero {
  padding: 24px 0 8px;
}
.hero h1 {
  font-size: 30px;
  margin: 0 0 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.filter {
  margin-bottom: 16px;
}
.work {
  margin-bottom: 16px;
}
.thumb {
  width: 100%;
  height: 160px;
  border-radius: 6px;
  background: #1c1917;
}
.text {
  white-space: pre-wrap;
  font-size: 13px;
  overflow: hidden;
  margin: 0;
  color: #e7e5e4;
  padding: 8px;
}
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78716c;
  font-size: 13px;
  border: 1px dashed #57534e;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
