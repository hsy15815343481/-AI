<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Check } from '@element-plus/icons-vue'
import { QUICK_TOOL_GROUPS, QUICK_TOOLS, quickToolsByGroup } from '../../lib/quickTools'

const props = defineProps({
  modelValue: { type: String, default: '' },
  // 可选：限定只展示某一用途的类型；缺省展示全部
  kind: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'select'])

const open = ref(false)

const groups = computed(() =>
  QUICK_TOOL_GROUPS.map((g) => ({
    ...g,
    items: quickToolsByGroup(g.key).filter((t) => !props.kind || t.kind === props.kind)
  })).filter((g) => g.items.length)
)

const current = computed(() => QUICK_TOOLS.find((t) => t.key === props.modelValue) || null)

function onPick(tool) {
  if (tool.pending) {
    ElMessage.warning(`「${tool.name}」待接入对应模型渠道，敬请期待`)
    return
  }
  open.value = false
  emit('update:modelValue', tool.key)
  emit('select', tool)
}
</script>

<template>
  <el-popover v-model:visible="open" placement="bottom-start" :width="240" trigger="click" popper-class="type-select-pop">
    <template #reference>
      <button class="trigger" type="button">
        <span v-if="current" class="t-icon">{{ current.icon }}</span>
        <span class="t-name">{{ current ? current.name : '选择类型' }}</span>
        <el-icon class="t-arrow" :class="{ open }"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="type-menu">
      <div class="menu-title">创作类型</div>
      <div v-for="g in groups" :key="g.key" class="menu-group">
        <div class="group-label">{{ g.label }}</div>
        <button
          v-for="t in g.items"
          :key="t.key"
          class="menu-item"
          :class="{ pending: t.pending, active: t.key === modelValue }"
          type="button"
          @click="onPick(t)"
        >
          <span class="m-icon">{{ t.icon }}</span>
          <span class="m-name">{{ t.name }}</span>
          <span v-if="t.pending" class="m-badge">待接入</span>
          <el-icon v-else-if="t.key === modelValue" class="m-check"><Check /></el-icon>
        </button>
      </div>
    </div>
  </el-popover>
</template>

<style scoped>
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}

.trigger:hover {
  border-color: var(--brand);
}

.t-icon {
  font-size: 14px;
}

.t-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.t-arrow {
  font-size: 12px;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.t-arrow.open {
  transform: rotate(180deg);
}

.type-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-title {
  font-size: 12px;
  color: var(--muted);
  padding: 2px 4px 8px;
}

.group-label {
  font-size: 11px;
  color: var(--muted);
  padding: 6px 4px 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.menu-item:hover {
  background: var(--surface-2);
}

.menu-item.active {
  background: var(--surface-2);
}

.menu-item.pending {
  opacity: 0.5;
}

.m-icon {
  font-size: 15px;
  flex-shrink: 0;
}

.m-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-badge {
  font-size: 10px;
  color: var(--muted);
  background: var(--surface-3);
  border-radius: 5px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.m-check {
  font-size: 14px;
  color: var(--brand);
  flex-shrink: 0;
}
</style>
