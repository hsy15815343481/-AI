<script setup>
import { computed, ref, inject } from 'vue'
import { Handle, useVueFlow, useNode } from '@vue-flow/core'
import { useWorkflowStore } from '../../stores/workflow'
import { NODE_TYPES, downloadText, downloadDataUrl } from '../../lib/workflow'
import { storeAsset, getAssetUrl } from '../../lib/asset'
import { Aim, Plus, View, Download, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  id: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

const store = useWorkflowStore()
const { fitView } = useVueFlow()
const { node } = useNode()
const previewVisible = ref(false)
const fileInput = ref(null)

const def = computed(() => NODE_TYPES[props.type])
const status = computed(() => props.data.status || 'idle')
const hasImage = computed(() => Boolean(props.data.resultUrl || props.data.imageUrl || props.data.imageData))
const hasText = computed(() => Boolean(props.data.resultText))
const previewImage = computed(() => props.data.resultUrl || props.data.imageUrl || props.data.imageData)

const NOTE_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff']
const isPlaceholder = computed(() => ['note', 'audio'].includes(props.type))
const isMockResult = computed(() => typeof props.data.resultUrl === 'string' && props.data.resultUrl.startsWith('mock://'))

// 节点本体模型下拉：与右侧参数面板读写同一组 data.model / data.channel
const channels = inject('workflowChannels', [])
const KIND_BY_TYPE = { 'ai-copy': 'chat', 'ai-image': 'image', video: 'video' }
const modelKind = computed(() => KIND_BY_TYPE[props.type] || '')
const modelOptions = computed(() =>
  channels.value
    .filter((c) => c.kind === modelKind.value)
    .flatMap((c) => c.models.map((m) => {
      const name = typeof m === 'string' ? m : m.model
      const label = typeof m === 'string' ? `${c.name} · ${m}` : `${c.name} · ${m.label || m.model}`
      return { channel: c.id, model: name, label }
    }))
)
function onNodeModelChange(val) {
  const opt = modelOptions.value.find((o) => o.model === val)
  props.data.channel = opt ? opt.channel : ''
}

const statusTag = {
  idle: { text: '待执行', type: 'info' },
  running: { text: '执行中', type: 'warning' },
  success: { text: '完成', type: 'success' },
  failed: { text: '失败', type: 'danger' }
}

function onFocus() {
  fitView({ nodes: [props.id], fitViewOptions: { padding: 0.4 } })
}

function onAddDownstream() {
  const pos = node.position || { x: 0, y: 0 }
  store.addNode('ai-copy', { x: (pos.x || 0) + 280, y: pos.y || 0 })
}

function onDelete() {
  store.removeNode(props.id)
}

// 排除自连；重复边由 store.onConnect 去重
function isValidConnection(conn) {
  return Boolean(conn) && conn.source !== conn.target
}

function onDownload() {
  if (previewImage.value) downloadDataUrl(previewImage.value, `${props.data.title}.png`)
  else if (hasText.value) downloadText(props.data.resultText, `${props.data.title}.txt`)
}

async function onPickFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    props.data.imageData = await storeAsset(file)
  } catch (err) {
    props.data.error = err.message || '图片读取失败'
  }
  e.target.value = ''
}

function onPaste(e) {
  if (props.type !== 'image') return
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (!file) return
  storeAsset(file)
    .then((url) => { props.data.imageData = url })
    .catch((err) => { props.data.error = err.message || '图片读取失败' })
}
</script>

<template>
  <div
    class="wf-node"
    :class="[`is-${status}`, { selected, 'is-note': type === 'note' }]"
    :style="type === 'note' ? { '--note-bg': data.color } : {}"
    @paste="onPaste"
  >
    <Handle
      v-if="!isPlaceholder"
      type="target"
      position="left"
      class="wf-handle"
      :is-valid-connection="isValidConnection"
    >
      <el-icon class="handle-plus"><Plus /></el-icon>
    </Handle>

    <div class="head">
      <span class="icon">{{ def.icon }}</span>
      <span class="title">{{ data.title }}</span>
      <el-tag v-if="data.status" size="small" :type="statusTag[status].type">{{ statusTag[status].text }}</el-tag>
    </div>

    <div class="body">
      <template v-if="type === 'text'">
        <div class="text-head">
          <el-switch v-model="data.collapsed" size="small" active-text="折叠" />
          <el-switch v-model="data.hidden" size="small" active-text="隐藏" disabled />
        </div>
        <el-input
          v-if="!data.collapsed"
          v-model="data.text"
          type="textarea"
          :rows="3"
          placeholder="输入文本内容…"
        />
        <div v-else class="placeholder">提示词已折叠，展开后可编辑</div>
      </template>

      <template v-else-if="type === 'image'">
        <el-image v-if="getAssetUrl(data.imageData || data.imageUrl)" :src="getAssetUrl(data.imageData || data.imageUrl)" fit="contain" class="thumb" />
        <div v-else class="placeholder">🖼 图片占位</div>
        <div class="upload-row">
          <el-button size="small" @click="fileInput?.click()">上传图片</el-button>
          <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onPickFile" />
        </div>
        <el-input v-model="data.imageUrl" placeholder="图片链接（可选，优先使用上传图）" class="mt" />
      </template>

      <template v-else-if="type === 'note'">
        <el-input v-model="data.note" type="textarea" :rows="4" placeholder="记录备注、踩坑经验…" />
        <div class="note-colors">
          <button
            v-for="c in NOTE_COLORS"
            :key="c"
            class="swatch"
            :class="{ active: data.color === c }"
            :style="{ background: c }"
            @click="data.color = c"
          />
        </div>
      </template>

      <template v-else-if="type === 'ai-copy'">
        <el-select v-model="data.tone" size="small" style="width:100%">
          <el-option label="活泼" value="活泼" />
          <el-option label="正式" value="正式" />
          <el-option label="种草" value="种草" />
          <el-option label="简洁" value="简洁" />
        </el-select>
        <pre v-if="data.resultText" class="result">{{ data.resultText }}</pre>
        <div v-else class="placeholder">执行后输出文案</div>
      </template>

      <template v-else-if="type === 'ai-image'">
        <el-input v-model="data.prompt" placeholder="提示词（可由上游文本传入）" />
        <el-image v-if="data.resultUrl" :src="data.resultUrl" fit="contain" class="thumb mt" />
        <div v-else class="placeholder">执行后输出图片</div>
        <div class="node-params-row">
          <el-select v-model="data.size" size="small" style="flex:1">
            <el-option label="1:1 方形" value="1:1" />
            <el-option label="3:4 竖版" value="3:4" />
            <el-option label="16:9 横版" value="16:9" />
          </el-select>
          <el-select v-model="data.count" size="small" style="flex:1">
            <el-option v-for="n in [1, 2, 3, 4]" :key="n" :label="`${n} 张`" :value="n" />
          </el-select>
        </div>
        <el-select v-model="data.resolution" size="small" class="mt">
          <el-option label="高清 2K" value="2K" />
          <el-option label="超清 4K" value="4K" />
        </el-select>
      </template>

      <template v-else-if="type === 'audio'">
        <div class="placeholder">待接入真实生成渠道</div>
      </template>

      <template v-else-if="type === 'video'">
        <video v-if="!isMockResult && data.resultUrl" :src="data.resultUrl" controls class="thumb" />
        <div v-else class="placeholder">执行后输出视频</div>
        <div class="node-params-row">
          <el-select v-model="data.ratio" size="small" style="flex:1">
            <el-option label="16:9 横版" value="16:9" />
            <el-option label="9:16 竖版" value="9:16" />
            <el-option label="1:1 方形" value="1:1" />
          </el-select>
          <el-input-number
            v-model="data.duration"
            :min="2"
            :max="30"
            size="small"
            style="flex:1"
            controls-position="right"
          />
        </div>
      </template>

      <div v-if="modelKind" class="node-model-row">
        <el-select
          v-model="data.model"
          size="small"
          style="width:100%"
          placeholder="默认渠道"
          @change="onNodeModelChange"
        >
          <el-option v-for="m in modelOptions" :key="m.model" :label="m.label" :value="m.model" />
        </el-select>
      </div>

      <div v-if="data.error" class="err">{{ data.error }}</div>
    </div>

    <!-- 选中后浮出的操作条 -->
    <div v-if="selected" class="node-actions">
      <el-tooltip content="聚焦" placement="top">
        <button class="act" @click="onFocus"><el-icon><Aim /></el-icon></button>
      </el-tooltip>
      <el-tooltip v-if="!isPlaceholder" content="添加下游" placement="top">
        <button class="act" @click="onAddDownstream"><el-icon><Plus /></el-icon></button>
      </el-tooltip>
      <el-tooltip v-if="!isPlaceholder" content="预览" placement="top">
        <button class="act" :disabled="!hasImage && !hasText" @click="previewVisible = true"><el-icon><View /></el-icon></button>
      </el-tooltip>
      <el-tooltip v-if="!isPlaceholder" content="下载" placement="top">
        <button class="act" :disabled="!hasImage && !hasText" @click="onDownload"><el-icon><Download /></el-icon></button>
      </el-tooltip>
      <el-tooltip content="删除" placement="top">
        <button class="act danger" @click="onDelete"><el-icon><Delete /></el-icon></button>
      </el-tooltip>
    </div>

    <Handle
      v-if="!isPlaceholder"
      type="source"
      position="right"
      class="wf-handle"
      :is-valid-connection="isValidConnection"
    />

    <el-dialog v-model="previewVisible" title="结果预览" width="480px">
      <el-image v-if="previewImage" :src="previewImage" fit="contain" class="preview-img" />
      <pre v-else-if="data.resultText" class="preview-text">{{ data.resultText }}</pre>
    </el-dialog>
  </div>
</template>

<style scoped>
.wf-node {
  position: relative;
  width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  color: var(--text);
  font-size: 13px;
}
.wf-node.is-note {
  background: var(--note-bg, #fde68a);
  color: #44403c;
  border-color: #d9b84a;
}
.wf-node.selected {
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
}
.is-failed { border-color: #ef4444; }
.is-success { border-color: #22c55e; }
.head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.title { font-weight: 600; flex: 1; }
.body { display: flex; flex-direction: column; gap: 6px; }
.thumb { width: 100%; height: 110px; border-radius: 6px; }
.placeholder {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 6px;
}
.note .placeholder { color: #78716c; }
.result {
  white-space: pre-wrap;
  margin: 0;
  font-size: 12px;
  max-height: 96px;
  overflow: auto;
}
.err { color: #dc2626; font-size: 12px; }
.mt { margin-top: 6px; }
.node-model-row { margin-top: 2px; }
.node-params-row { display: flex; gap: 6px; }
.text-head { display: flex; justify-content: space-between; align-items: center; }
.upload-row { display: flex; justify-content: center; }
.note-colors { display: flex; gap: 6px; }
.swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #78716c;
  cursor: pointer;
}
.swatch.active { outline: 2px solid #38bdf8; }
.node-actions {
  position: absolute;
  top: -14px;
  right: 8px;
  display: flex;
  gap: 4px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
}
.act {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--surface-2);
  border: none;
  border-radius: 6px;
  color: var(--text);
  cursor: pointer;
}
.act:hover { border-color: #38bdf8; }
.act.danger { color: #dc2626; }
.act:disabled { opacity: 0.35; cursor: not-allowed; }
.preview-img { width: 100%; max-height: 360px; }
.preview-text { white-space: pre-wrap; margin: 0; }

/* 连线端口：默认小圆点，拖拽悬停到有效目标时放大并显示加号 */
.wf-handle {
  width: 13px;
  height: 13px;
  background: var(--surface-3);
  border: 1px solid var(--border);
}
.handle-plus {
  width: 10px;
  height: 10px;
  opacity: 0;
  color: #fff;
  font-size: 10px;
}
.wf-handle.vue-flow__handle-connecting {
  background: var(--brand-2);
}
.wf-handle.vue-flow__handle-valid {
  width: 18px;
  height: 18px;
  background: var(--brand);
  border-color: var(--brand);
}
.wf-handle.vue-flow__handle-valid .handle-plus {
  opacity: 1;
}
</style>
