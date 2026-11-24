<script setup>
import { onMounted, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorksStore } from '../stores/works'
import { downloadText, downloadDataUrl } from '../lib/workflow'

const works = useWorksStore()
const loading = ref(false)
const previewItem = ref(null)

const TOOL_LABELS = {
  'text-to-image': 'AI 绘画',
  copywriting: '文案生成',
  'text-to-video': 'AI 视频'
}

onMounted(async () => {
  loading.value = true
  try {
    await works.loadWorks()
  } catch (err) {
    ElMessage.error(err.message || '作品加载失败')
  } finally {
    loading.value = false
  }
})

function toolLabel(item) {
  return TOOL_LABELS[item.toolSlug || item.tool_slug] || item.toolSlug || item.tool_slug || '作品'
}

function isVideo(item) {
  const slug = item.toolSlug || item.tool_slug
  return slug === 'text-to-video'
}

function isMock(item) {
  return typeof item.resultUrl === 'string' && item.resultUrl.startsWith('mock://')
}

function hasMedia(item) {
  return Boolean(item.resultUrl) && !isMock(item)
}

function openPreview(item) {
  previewItem.value = item
}

function download(item) {
  if (item.resultText) {
    downloadText(item.resultText, `${toolLabel(item)}.txt`)
    return
  }
  if (!hasMedia(item)) {
    ElMessage.warning('暂无可下载内容')
    return
  }
  if (/^data:/.test(item.resultUrl)) {
    downloadDataUrl(item.resultUrl, `${toolLabel(item)}.png`)
    return
  }
  // 远程图片/视频：跨域无法直接落本地时，新窗口打开原片
  window.open(item.resultUrl, '_blank')
}

const previewVisible = computed({
  get: () => Boolean(previewItem.value),
  set: (v) => { if (!v) previewItem.value = null }
})
</script>

<template>
  <h1 class="page-title">我的作品</h1>
  <el-skeleton v-if="loading" :rows="4" animated />
  <el-empty v-else-if="!works.list.length" description="还没有作品，去工作流创作第一条吧" />
  <el-row v-else :gutter="16">
    <el-col :xs="24" :sm="12" :md="8" v-for="item in works.list" :key="item.id">
      <el-card class="work">
        <!-- 视频结果 -->
        <video v-if="isVideo(item) && hasMedia(item)" :src="item.resultUrl" controls class="thumb" />
        <!-- 图片结果 -->
        <el-image
          v-else-if="item.resultUrl && !isMock(item)"
          :src="item.resultUrl"
          fit="contain"
          class="thumb"
          @click="openPreview(item)"
        />
        <!-- mock 占位 -->
        <div v-else-if="isMock(item)" class="thumb placeholder">生成结果占位（未接入真实模型）</div>
        <!-- 文案结果 -->
        <pre v-else-if="item.resultText" class="text">{{ item.resultText }}</pre>
        <div v-else class="thumb placeholder">暂无结果</div>

        <template #footer>
          <div class="foot">
            <span class="muted">{{ toolLabel(item) }} · {{ item.createdAt || item.created_at }}</span>
            <div class="actions">
              <el-button v-if="hasMedia(item)" size="small" @click="openPreview(item)">预览</el-button>
              <el-button size="small" @click="download(item)">下载</el-button>
            </div>
          </div>
        </template>
      </el-card>
    </el-col>
  </el-row>

  <el-dialog v-model="previewVisible" title="结果预览" width="640px">
    <video
      v-if="previewItem && isVideo(previewItem) && hasMedia(previewItem)"
      :src="previewItem.resultUrl"
      controls
      class="preview-media"
    />
    <el-image
      v-else-if="previewItem && previewItem.resultUrl && !isMock(previewItem)"
      :src="previewItem.resultUrl"
      fit="contain"
      class="preview-media"
    />
    <pre v-else-if="previewItem && previewItem.resultText" class="preview-text">{{ previewItem.resultText }}</pre>
    <div v-else class="placeholder">暂无可预览内容</div>
  </el-dialog>
</template>

<style scoped>
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
  height: 160px;
  overflow: hidden;
  margin: 0;
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
.actions {
  display: flex;
  gap: 6px;
}
.preview-media {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
}
.preview-text {
  white-space: pre-wrap;
  margin: 0;
}
</style>
