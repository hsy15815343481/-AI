<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { QUICK_TOOL_GROUPS, QUICK_TOOLS, quickToolsByGroup } from '../lib/quickTools'

const router = useRouter()

// 分组默认全部展开
const expanded = reactive(
  Object.fromEntries(QUICK_TOOL_GROUPS.map((g) => [g.key, true]))
)

function toggle(groupKey) {
  expanded[groupKey] = !expanded[groupKey]
}

function onSelect(tool) {
  if (tool.pending) {
    ElMessage.warning(`「${tool.name}」待接入对应模型渠道，敬请期待`)
    return
  }
  const query = tool.presetSlug ? { preset: tool.presetSlug } : {}
  router.push({ path: `/tool/${tool.targetTool}`, query })
}
</script>

<template>
  <div class="quick-tools">
    <div v-for="g in QUICK_TOOL_GROUPS" :key="g.key" class="q-group">
      <button class="q-group-head" @click="toggle(g.key)">
        <span class="q-group-label">{{ g.label }}</span>
        <el-icon class="q-arrow" :class="{ open: expanded[g.key] }">
          <ArrowDown />
        </el-icon>
      </button>
      <div v-show="expanded[g.key]" class="q-list">
        <button
          v-for="t in quickToolsByGroup(g.key)"
          :key="t.key"
          class="q-item"
          :class="{ pending: t.pending }"
          @click="onSelect(t)"
        >
          <span class="q-icon">{{ t.icon }}</span>
          <span class="q-name">{{ t.name }}</span>
          <span v-if="t.pending" class="q-badge">待接入</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.q-group-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 6px 4px;
  color: #98a0ad;
  font-size: 12px;
  cursor: pointer;
}

.q-group-label {
  letter-spacing: 0.02em;
}

.q-arrow {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.q-arrow.open {
  transform: rotate(0deg);
}

.q-arrow:not(.open) {
  transform: rotate(-90deg);
}

.q-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}

.q-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  color: #d6dae0;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.q-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.q-item.pending {
  opacity: 0.55;
}

.q-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.q-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.q-badge {
  font-size: 10px;
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  padding: 1px 6px;
  flex-shrink: 0;
}
</style>
