<script setup>
import { computed, ref, onMounted, provide, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Plus } from '@element-plus/icons-vue'
import '@vue-flow/core/dist/style.css'
import WfNode from '../components/workflow/WfNode.vue'
import { useWorkflowStore } from '../stores/workflow'
import { NODE_TYPES } from '../lib/workflow'
import { getWorkflowTemplate } from '../lib/workflowTemplates'
import { fetchChannels } from '../api/channels'

const store = useWorkflowStore()
const route = useRoute()
const router = useRouter()
const { fitView, project } = useVueFlow()

// 空白画布引导：无节点时展示起步入口
const isEmpty = computed(() => store.nodes.length === 0)
function goTemplates() {
  router.push('/')
}

// 左侧节点面板：收起为窄竖条，点「添加」展开分组清单
const panelOpen = ref(false)
const flatNodes = computed(() =>
  Object.entries(NODE_TYPES).map(([type, def]) => ({ type, ...def }))
)

const channels = ref([])
onMounted(async () => {
  const tpl = getWorkflowTemplate(route.query.template)
  if (tpl) {
    store.loadTemplate(tpl)
    await nextTick()
    setTimeout(() => fitView({ padding: 0.25, includeHiddenNodes: false }), 60)
  }
  try {
    channels.value = await fetchChannels()
  } catch {
    channels.value = []
  }
})

const NOTE_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff']

function modelOptions(kind) {
  return channels.value
    .filter((c) => c.kind === kind)
    .flatMap((c) => c.models.map((m) => {
      const name = typeof m === 'string' ? m : m.model
      const label = typeof m === 'string' ? `${c.name} · ${m}` : `${c.name} · ${m.label || m.model}`
      return { channel: c.id, model: name, label }
    }))
}

// 选中模型时同步回写渠道 id，保证后端按渠道精确定位（而非回退到首个已配 Key 的渠道）
function syncChannel(node, kind, model) {
  const opt = modelOptions(kind).find((o) => o.model === model)
  node.data.channel = opt ? opt.channel : ''
}

// 把渠道列表下发给节点卡片，供节点本体上的模型下拉复用
provide('workflowChannels', channels)

const nodeTypes = {
  text: WfNode,
  image: WfNode,
  note: WfNode,
  'ai-copy': WfNode,
  'ai-image': WfNode,
  audio: WfNode,
  video: WfNode
}

const groups = computed(() => {
  const map = {}
  for (const [type, def] of Object.entries(NODE_TYPES)) {
    ;(map[def.category] = map[def.category] || []).push({ type, ...def })
  }
  return map
})

let offset = 0
function addNode(type) {
  offset += 1
  const position = project({ x: 140 + offset * 40, y: 120 + offset * 40 })
  store.addNode(type, position)
}

function onDragStart(e, type) {
  e.dataTransfer.setData('application/vue-flow', type)
  e.dataTransfer.effectAllowed = 'move'
}

function onDrop(e) {
  e.preventDefault()
  const type = e.dataTransfer.getData('application/vue-flow')
  if (!type) return
  const position = project({ x: e.clientX, y: e.clientY })
  store.addNode(type, position)
}

const selectedNode = computed(() => store.nodes.find((n) => n.id === store.selectedId) || null)

function onNodeClick({ node }) {
  store.select(node.id)
}

async function onRun() {
  await store.run()
  fitView()
}
</script>

<template>
  <div class="wf-page">
    <aside class="side" :class="{ expanded: panelOpen }">
      <button class="side-add" @click="panelOpen = !panelOpen">
        <el-icon><Plus /></el-icon>
        <span v-if="panelOpen">添加节点</span>
      </button>

      <!-- 收起态：窄竖条快捷图标，点击直接添加 -->
      <div class="rail-icons">
        <button
          v-for="item in flatNodes"
          :key="item.type"
          class="rail-icon"
          :title="item.label"
          @click="addNode(item.type)"
        >
          <span class="ni-icon">{{ item.icon }}</span>
        </button>
      </div>

      <!-- 展开态：分组节点清单，可点击或拖拽到画布 -->
      <div v-if="panelOpen" class="side-list">
        <div v-for="(items, category) in groups" :key="category" class="group">
          <div class="group-name">{{ category }}</div>
          <div
            v-for="item in items"
            :key="item.type"
            class="node-item"
            draggable="true"
            @dragstart="onDragStart($event, item.type)"
            @click="addNode(item.type)"
          >
            <span class="ni-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </div>
        </div>
        <div class="side-tip">可点击添加，或拖到画布；拖到目标节点松手即可连线</div>
      </div>
    </aside>

    <div class="canvas" @dragover.prevent @drop="onDrop">
      <VueFlow
        v-model:nodes="store.nodes"
        v-model:edges="store.edges"
        :node-types="nodeTypes"
        fit-view
        :min-zoom="0.4"
        :max-zoom="1.6"
        @connect="store.onConnect"
        @node-click="onNodeClick"
        @pane-click="store.select(null)"
      >
        <Background :gap="24" color="#d5dbe3" />

        <Panel position="top-right">
          <div class="toolbar">
            <el-button size="small" :disabled="store.running" @click="onRun">
              {{ store.running ? '执行中…' : '运行工作流' }}
            </el-button>
            <el-button size="small" @click="fitView()">聚焦全图</el-button>
            <el-button size="small" plain @click="store.addOutfitTemplate()">穿搭模板</el-button>
            <el-button v-if="selectedNode" size="small" type="danger" plain @click="store.removeNode(selectedNode.id)">
              删除节点
            </el-button>
            <el-button size="small" plain @click="store.clearCanvas()">清空</el-button>
          </div>
        </Panel>
      </VueFlow>

      <el-alert v-if="store.lastError" :title="store.lastError" type="error" class="err-bar" :closable="false" />

      <!-- 空白画布引导：无节点时展示起步入口 -->
      <div v-if="isEmpty" class="canvas-empty">
        <div class="empty-card">
          <div class="empty-icon">🧩</div>
          <h3>从一个节点开始搭建工作流</h3>
          <p class="muted">左侧窄条点击直接添加节点，或从模板市场套用整套流程。</p>
          <div class="empty-actions">
            <el-button type="primary" plain @click="addNode('text')">添加文本节点</el-button>
            <el-button plain @click="addNode('image')">添加图片节点</el-button>
            <el-button @click="goTemplates">浏览模板</el-button>
          </div>
        </div>
      </div>
    </div>

    <aside v-if="selectedNode" class="params">
      <div class="params-title">节点参数</div>
      <div class="params-sub">{{ NODE_TYPES[selectedNode.type].label }}</div>

      <el-form label-position="top" class="params-form">
        <template v-if="selectedNode.type === 'text'">
          <el-form-item label="文本内容">
            <el-input v-model="selectedNode.data.text" type="textarea" :rows="5" placeholder="输入文本…" />
          </el-form-item>
          <el-form-item label="折叠提示词">
            <el-switch v-model="selectedNode.data.collapsed" />
          </el-form-item>
          <el-form-item label="隐藏提示词（会员解锁预留）">
            <el-switch v-model="selectedNode.data.hidden" disabled />
          </el-form-item>
        </template>

        <template v-else-if="selectedNode.type === 'image'">
          <el-alert type="info" :closable="false" title="可在节点卡片直接上传或粘贴图片；链接作为兜底来源。" class="params-alert" />
          <el-form-item label="图片链接">
            <el-input v-model="selectedNode.data.imageUrl" placeholder="粘贴图片 URL（可选）" />
          </el-form-item>
        </template>

        <template v-else-if="selectedNode.type === 'note'">
          <el-form-item label="备注内容">
            <el-input v-model="selectedNode.data.note" type="textarea" :rows="5" placeholder="记录备注、踩坑经验…" />
          </el-form-item>
          <el-form-item label="便签颜色">
            <el-select v-model="selectedNode.data.color" style="width:100%">
              <el-option v-for="c in NOTE_COLORS" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </template>

        <template v-else-if="selectedNode.type === 'ai-copy'">
          <el-form-item label="模型">
            <el-select
              v-model="selectedNode.data.model"
              style="width:100%"
              placeholder="默认渠道"
              @change="syncChannel(selectedNode, 'chat', selectedNode.data.model)"
            >
              <el-option v-for="m in modelOptions('chat')" :key="m.model" :label="m.label" :value="m.model" />
            </el-select>
          </el-form-item>
          <el-form-item label="语气">
            <el-select v-model="selectedNode.data.tone" style="width:100%">
              <el-option label="活泼" value="活泼" />
              <el-option label="正式" value="正式" />
              <el-option label="种草" value="种草" />
              <el-option label="简洁" value="简洁" />
            </el-select>
          </el-form-item>
          <el-form-item label="补充主题（无上游文本时使用）">
            <el-input v-model="selectedNode.data.inputText" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item v-if="selectedNode.data.resultText" label="输出文案">
            <div class="readonly">{{ selectedNode.data.resultText }}</div>
          </el-form-item>
        </template>

        <template v-else-if="selectedNode.type === 'ai-image'">
          <el-form-item label="模型">
            <el-select
              v-model="selectedNode.data.model"
              style="width:100%"
              placeholder="默认渠道"
              @change="syncChannel(selectedNode, 'image', selectedNode.data.model)"
            >
              <el-option v-for="m in modelOptions('image')" :key="m.model" :label="m.label" :value="m.model" />
            </el-select>
          </el-form-item>
          <el-form-item label="画幅比例">
            <el-select v-model="selectedNode.data.size" style="width:100%">
              <el-option label="1:1 方形" value="1:1" />
              <el-option label="3:4 竖版" value="3:4" />
              <el-option label="16:9 横版" value="16:9" />
            </el-select>
          </el-form-item>
          <el-form-item label="生成张数">
            <el-select v-model="selectedNode.data.count" style="width:100%">
              <el-option v-for="n in [1, 2, 3, 4]" :key="n" :label="`${n} 张`" :value="n" />
            </el-select>
          </el-form-item>
          <el-form-item label="清晰度">
            <el-select v-model="selectedNode.data.resolution" style="width:100%">
              <el-option label="高清 2K" value="2K" />
              <el-option label="超清 4K" value="4K" />
            </el-select>
          </el-form-item>
          <el-form-item label="提示词（无上游文本时使用）">
            <el-input v-model="selectedNode.data.prompt" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="参考图">
            <el-button size="small" disabled>上传参考图（待图生图渠道接入）</el-button>
          </el-form-item>
          <el-alert type="info" :closable="false" title="参考图由上游图片节点连线传入；当前渠道为文生图，参考图先预留待后续支持。" class="params-alert" />
          <el-form-item v-if="selectedNode.data.resultUrl" label="输出图片">
            <el-image :src="selectedNode.data.resultUrl" fit="contain" class="params-img" />
          </el-form-item>
        </template>

        <template v-else-if="selectedNode.type === 'video'">
          <el-form-item label="模型">
            <el-select
              v-model="selectedNode.data.model"
              style="width:100%"
              placeholder="默认渠道"
              @change="syncChannel(selectedNode, 'video', selectedNode.data.model)"
            >
              <el-option v-for="m in modelOptions('video')" :key="m.model" :label="m.label" :value="m.model" />
            </el-select>
          </el-form-item>
          <el-form-item label="提示词（无上游文本时使用）">
            <el-input v-model="selectedNode.data.prompt" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="画幅比例">
            <el-select v-model="selectedNode.data.ratio" style="width:100%">
              <el-option label="16:9 横版" value="16:9" />
              <el-option label="9:16 竖版" value="9:16" />
              <el-option label="1:1 方形" value="1:1" />
            </el-select>
          </el-form-item>
          <el-form-item label="时长（秒）">
            <el-input-number v-model="selectedNode.data.duration" :min="2" :max="30" style="width:100%" />
          </el-form-item>
          <el-alert type="info" :closable="false" title="参考图由上游图片节点连线传入；视频为异步生成，提交后需等待出片。" class="params-alert" />
          <el-form-item v-if="selectedNode.data.resultUrl && !selectedNode.data.resultUrl.startsWith('mock://')" label="输出视频">
            <video :src="selectedNode.data.resultUrl" controls class="params-video" />
          </el-form-item>
        </template>
      </el-form>
    </aside>
  </div>
</template>

<style scoped>
.wf-page {
  display: flex;
  width: 100%;
  height: calc(100vh - 56px);
  background: var(--bg);
}
.side {
  width: 64px;
  border-right: 1px solid var(--border);
  padding: 12px 10px;
  overflow-y: auto;
  color: var(--text);
  transition: width 0.18s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.side.expanded {
  width: 200px;
  padding: 14px;
}

.side-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  border: 1px dashed var(--border);
  background: var(--surface-2);
  border-radius: 10px;
  padding: 9px 8px;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}
.side-add:hover { border-color: var(--brand-2); }

.rail-icons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.side.expanded .rail-icons { display: none; }

.rail-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  cursor: pointer;
  font-size: 16px;
}
.rail-icon:hover { border-color: var(--brand-2); }

.side-list { display: flex; flex-direction: column; gap: 14px; }
.group { margin-bottom: 0; }
.group-name { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  cursor: grab;
}
.node-item:hover { border-color: var(--brand-2); }
.ni-icon { width: 20px; }
.side-tip { margin-top: 4px; font-size: 12px; color: var(--muted); line-height: 1.6; }
.canvas { flex: 1; position: relative; }
.toolbar { display: flex; gap: 8px; }

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}
.empty-card {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  padding: 28px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  text-align: center;
}
.empty-icon { font-size: 34px; }
.empty-card h3 { margin: 0; font-size: 16px; color: var(--text); }
.empty-card .muted { margin: 0; font-size: 13px; line-height: 1.6; }
.empty-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
.err-bar { position: absolute; left: 16px; bottom: 16px; width: 320px; }
.params {
  width: 260px;
  border-left: 1px solid var(--border);
  padding: 14px;
  overflow-y: auto;
  color: var(--text);
}
.params-title { font-weight: 700; }
.params-sub { font-size: 12px; color: var(--muted); margin: 4px 0 12px; }
.params-img { width: 100%; height: 140px; border-radius: 6px; }
.params-video { width: 100%; max-height: 180px; border-radius: 6px; }
.params-alert { margin-bottom: 12px; }
.readonly {
  white-space: pre-wrap;
  font-size: 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px;
  max-height: 160px;
  overflow: auto;
}
</style>
