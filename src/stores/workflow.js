import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { createNode, runWorkflow, NODE_TYPES } from '../lib/workflow'

const STORAGE_KEY = 'wf-canvas-v1'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { nodes: [], edges: [] }
    const parsed = JSON.parse(raw)
    return { nodes: parsed.nodes || [], edges: parsed.edges || [] }
  } catch {
    return { nodes: [], edges: [] }
  }
}

export const useWorkflowStore = defineStore('workflow', () => {
  const saved = loadSaved()
  const nodes = ref(saved.nodes)
  const edges = ref(saved.edges)
  const selectedId = ref(null)
  const running = ref(false)
  const lastError = ref('')

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: nodes.value, edges: edges.value }))
  }

  // 节点/连线/参数变更自动持久化
  watch(nodes, persist, { deep: true })
  watch(edges, persist, { deep: true })

  function addNode(type, position) {
    const node = createNode(type, position)
    nodes.value.push(node)
    return node
  }

  function onConnect(connection) {
    const exists = edges.value.some(
      (e) => e.source === connection.source && e.target === connection.target
    )
    if (exists) return
    edges.value.push({
      id: `e_${connection.source}_${connection.target}`,
      source: connection.source,
      target: connection.target
    })
  }

  function removeNode(id) {
    nodes.value = nodes.value.filter((n) => n.id !== id)
    edges.value = edges.value.filter((e) => e.source !== id && e.target !== id)
    if (selectedId.value === id) selectedId.value = null
  }

  function removeEdge(id) {
    edges.value = edges.value.filter((e) => e.id !== id)
  }

  function select(id) {
    selectedId.value = id
  }

  async function run() {
    running.value = true
    lastError.value = ''
    for (const n of nodes.value) {
      if (n.data.status) n.data.status = 'idle'
      n.data.error = ''
    }
    try {
      await runWorkflow(nodes.value, edges.value, (node) => {
        const target = nodes.value.find((n) => n.id === node.id)
        if (target) Object.assign(target.data, node.data)
      })
    } catch (err) {
      lastError.value = err.message || '执行失败'
      // 中断兜底：把仍停留在执行中的节点标记为失败，避免卡片一直卡在「执行中」
      for (const n of nodes.value) {
        if (n.data.status === 'running') {
          n.data.status = 'failed'
          n.data.error = n.data.error || '工作流中断，未完成生成'
        }
      }
    } finally {
      running.value = false
      persist()
    }
  }

  function clearCanvas() {
    nodes.value = []
    edges.value = []
    selectedId.value = null
  }

  // 加载一套预置工作流模板：清空画布后按模板节点/连线重建
  function loadTemplate(tpl) {
    if (!tpl) return
    // 原地清空，保持数组引用，避免画布 v-model 引用不同步
    nodes.value.splice(0, nodes.value.length)
    edges.value.splice(0, edges.value.length)
    selectedId.value = null
    const keyToId = {}
    for (const n of tpl.nodes) {
      const node = createNode(n.type, n.position)
      Object.assign(node.data, n.data || {})
      keyToId[n.key] = node.id
      nodes.value.push(node)
    }
    for (const e of tpl.edges) {
      const source = keyToId[e.source]
      const target = keyToId[e.target]
      if (!source || !target) continue
      edges.value.push({ id: `e_${source}_${target}`, source, target })
    }
    persist()
  }

  // 预置「人物自拍 + 单品图 → 穿搭成品」模板
  function addOutfitTemplate() {
    const nText = addNode('text', { x: 80, y: 80 })
    nText.data.text = '参考人物与单品，生成自然真实的早秋穿搭展示图。'
    const nPerson = addNode('image', { x: 80, y: 200 })
    nPerson.data.title = '人物自拍'
    const nItem = addNode('image', { x: 80, y: 320 })
    nItem.data.title = '单品图'
    const nOut = addNode('ai-image', { x: 420, y: 200 })
    nOut.data.title = '穿搭成品'
    const links = [
      [nText.id, nOut.id],
      [nPerson.id, nOut.id],
      [nItem.id, nOut.id]
    ]
    for (const [source, target] of links) {
      edges.value.push({ id: `e_${source}_${target}`, source, target })
    }
    persist()
  }

  function nodeLabel(type) {
    return NODE_TYPES[type]?.label || type
  }

  return {
    nodes,
    edges,
    selectedId,
    running,
    lastError,
    persist,
    addNode,
    onConnect,
    removeNode,
    removeEdge,
    select,
    run,
    clearCanvas,
    addOutfitTemplate,
    loadTemplate,
    nodeLabel
  }
})
