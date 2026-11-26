/**
 * 工作流节点类型定义与执行引擎。
 * 节点分四类：文本节点、图片节点、AI 文案节点、AI 绘画节点。
 * 执行按连线拓扑顺序流转：上游节点输出作为下游节点输入。
 */
import { createGeneration, fetchGeneration } from '../api/generations'

export const NODE_TYPES = {
  text: {
    label: '文本节点',
    icon: 'T',
    category: '输入',
    defaults: { title: '文本节点', text: '', collapsed: false, hidden: false }
  },
  image: {
    label: '图片节点',
    icon: '🖼',
    category: '输入',
    defaults: { title: '图片节点', imageUrl: '', imageData: '' }
  },
  note: {
    label: '便签',
    icon: '📝',
    category: '辅助',
    defaults: { title: '便签', note: '', color: '#fde68a' }
  },
  'ai-copy': {
    label: 'AI 文案',
    icon: '✨',
    category: 'AI 处理',
    defaults: { title: 'AI 文案', tone: '种草', inputText: '', channel: '', model: '', resultText: '', status: 'idle' }
  },
  'ai-image': {
    label: 'AI 绘画',
    icon: '🎨',
    category: 'AI 处理',
    defaults: { title: 'AI 绘画', prompt: '', size: '1:1', count: 1, resolution: '2K', channel: '', model: '', resultUrl: '', status: 'idle' }
  },
  audio: {
    label: '音频节点',
    icon: '🎵',
    category: '多媒体',
    defaults: { title: '音频节点' }
  },
  video: {
    label: '视频节点',
    icon: '🎬',
    category: '多媒体',
    defaults: { title: '视频节点', prompt: '', ratio: '16:9', duration: 5, channel: '', model: '', resultUrl: '', status: 'idle' }
  }
}

/** 触发浏览器下载文本文件 */
export function downloadText(text, filename) {
  const blob = new Blob([text || ''], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 触发浏览器下载 dataURI 图片 */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

let seq = 0
export function makeId(prefix = 'n') {
  seq += 1
  return `${prefix}_${Date.now().toString(36)}_${seq}`
}

export function createNode(type, position) {
  const def = NODE_TYPES[type]
  return {
    id: makeId(),
    type,
    position,
    data: { ...def.defaults }
  }
}

const IMAGE_SIZES = ['1:1', '3:4', '16:9']
const VIDEO_RATIOS = ['16:9', '9:16', '1:1']
const TONES = ['活泼', '正式', '种草', '简洁']

function clampInt(v, min, max, fallback) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function pickEnum(v, list, fallback) {
  return list.includes(v) ? v : fallback
}

function cleanRefs(refs) {
  return (Array.isArray(refs) ? refs : []).filter(Boolean)
}

/** 收集某节点的上游输出（按连入边取源节点结果） */
function collectInputs(nodeId, edges, outputs) {
  const texts = []
  const images = []
  for (const edge of edges) {
    if (edge.target === nodeId) {
      const up = outputs[edge.source]
      if (!up) continue
      if (up.text) texts.push(up.text)
      if (up.imageUrl) images.push(up.imageUrl)
      if (Array.isArray(up.images)) images.push(...up.images)
    }
  }
  // 去重并过滤空值
  const uniqueImages = [...new Set(images.filter(Boolean))]
  return { text: texts.join('\n'), images: uniqueImages, imageUrl: uniqueImages[0] || '' }
}

/** 拓扑排序（Kahn），返回可执行顺序；含环时返回空数组 */
export function topoSort(nodes, edges) {
  const indeg = Object.fromEntries(nodes.map((n) => [n.id, 0]))
  for (const e of edges) indeg[e.target] = (indeg[e.target] || 0) + 1
  const queue = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id)
  const order = []
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    for (const e of edges) {
      if (e.source !== id) continue
      indeg[e.target] -= 1
      if (indeg[e.target] === 0) queue.push(e.target)
    }
  }
  return order.map((id) => byId[id]).filter(Boolean)
}

async function runSingle(node, inputs) {
  const d = node.data
  switch (node.type) {
    case 'text':
      return { text: d.text }
    case 'image': {
      const first = d.imageData || d.imageUrl || ''
      return { imageUrl: first, images: first ? [first] : [] }
    }
    case 'note':
      return {}
    case 'audio':
      // 音频占位：暂不接入真实生成渠道，后续接入后在此补充调用逻辑
      return {}
    case 'video': {
      const prompt = (inputs.text || d.prompt || '').trim()
      if (!prompt) throw new Error('缺少视频提示词（上游未传入文本）')
      d.status = 'running'
      const created = await createGeneration({
        tool_slug: 'text-to-video',
        params: {
          prompt,
          ratio: pickEnum(d.ratio, VIDEO_RATIOS, '16:9'),
          duration: clampInt(d.duration, 2, 30, 5),
          refs: cleanRefs(inputs.images)
        },
        channel: d.channel || '',
        model: d.model || ''
      })
      const detail = await pollDone(created.id)
      d.resultUrl = detail.resultUrl || ''
      d.status = detail.status === 'success' ? 'success' : 'failed'
      if (detail.status !== 'success') throw new Error(detail.errorMessage || '视频生成失败')
      return { imageUrl: d.resultUrl, images: d.resultUrl ? [d.resultUrl] : [] }
    }
    case 'ai-copy': {
      const topic = (inputs.text || d.inputText || '').trim()
      if (!topic) throw new Error('缺少文案主题（上游未传入文本）')
      d.status = 'running'
      const created = await createGeneration({
        tool_slug: 'copywriting',
        params: { topic, tone: pickEnum(d.tone, TONES, '种草') },
        channel: d.channel || '',
        model: d.model || ''
      })
      const detail = await pollDone(created.id)
      d.resultText = detail.resultText || ''
      d.status = detail.status === 'success' ? 'success' : 'failed'
      if (detail.status !== 'success') throw new Error(detail.errorMessage || '文案生成失败')
      return { text: d.resultText }
    }
    case 'ai-image': {
      const prompt = (inputs.text || d.prompt || '').trim()
      if (!prompt) throw new Error('缺少绘画提示词（上游未传入文本）')
      d.status = 'running'
      const created = await createGeneration({
        tool_slug: 'text-to-image',
        params: {
          prompt,
          size: pickEnum(d.size, IMAGE_SIZES, '1:1'),
          n: clampInt(d.count, 1, 4, 1),
          resolution: d.resolution || '2K',
          refs: cleanRefs(inputs.images)
        },
        channel: d.channel || '',
        model: d.model || ''
      })
      const detail = await pollDone(created.id)
      d.resultUrl = detail.resultUrl || ''
      d.status = detail.status === 'success' ? 'success' : 'failed'
      if (detail.status !== 'success') throw new Error(detail.errorMessage || '绘画生成失败')
      return { imageUrl: d.resultUrl, images: d.resultUrl ? [d.resultUrl] : [] }
    }
    default:
      return {}
  }
}

async function pollDone(id) {
  for (let i = 0; i < 10; i++) {
    const detail = await fetchGeneration(id)
    if (detail.status === 'success' || detail.status === 'failed') return detail
    await new Promise((r) => setTimeout(r, 800))
  }
  return { status: 'failed', errorMessage: '任务超时' }
}

/**
 * 执行整条工作流。
 * @param {Array} nodes 节点
 * @param {Array} edges 连线
 * @param {(node)=>void} onNodeUpdate 节点状态回写回调
 * @returns {Promise<Object>} outputs 节点 id -> 输出
 */
export async function runWorkflow(nodes, edges, onNodeUpdate) {
  const outputs = {}
  const ordered = topoSort(nodes, edges)
  if (ordered.length !== nodes.length) {
    throw new Error('连线存在环，无法执行')
  }
  for (const node of ordered) {
    const inputs = collectInputs(node.id, edges, outputs)
    try {
      outputs[node.id] = await runSingle(node, inputs)
    } catch (err) {
      node.data.status = 'failed'
      node.data.error = err.message
      onNodeUpdate?.(node)
      throw err
    }
    onNodeUpdate?.(node)
  }
  return outputs
}
