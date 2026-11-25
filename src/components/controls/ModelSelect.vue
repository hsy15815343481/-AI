<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, Check, Box } from '@element-plus/icons-vue'
import { MODEL_CATALOG, modelsByKind } from '../../lib/modelCatalog'

const props = defineProps({
  modelValue: { type: String, default: '' },
  kind: { type: String, default: 'image' },
  // 后端 /channels 扁平化后的模型列表；为空时回退本地目录
  options: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'select'])

const open = ref(false)

const list = computed(() => {
  const source = props.options.length ? props.options : modelsByKind(props.kind)
  return source.filter((m) => !props.kind || m.kind === props.kind)
})

const current = computed(() => list.value.find((m) => m.model === props.modelValue) || list.value[0] || null)

function onPick(model) {
  if (!model.available) {
    // 未开通渠道：仅提示，不切换
    return
  }
  open.value = false
  emit('update:modelValue', model.model)
  emit('select', { channel: model.channel, model: model.model, key: model.key, label: model.label })
}
</script>

<template>
  <el-popover v-model:visible="open" placement="bottom-start" :width="300" trigger="click" popper-class="model-select-pop">
    <template #reference>
      <button class="trigger" type="button">
        <el-icon class="t-icon"><Box /></el-icon>
        <span class="t-name">{{ current ? current.label : '选择模型' }}</span>
        <el-icon class="t-arrow" :class="{ open }"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="model-menu">
      <div class="menu-tip">请选择适合你的模型</div>
      <button
        v-for="m in list"
        :key="m.key || m.model"
        class="model-item"
        :class="{ pending: !m.available, active: m.model === modelValue }"
        type="button"
        @click="onPick(m)"
      >
        <el-icon class="m-icon"><Box /></el-icon>
        <span class="m-body">
          <span class="m-head">
            <span class="m-label">{{ m.label }}</span>
            <span v-if="m.badge" class="m-badge">{{ m.badge }}</span>
          </span>
          <span class="m-desc">{{ m.desc }}</span>
          <span v-if="m.fit" class="m-fit">{{ m.fit }}</span>
        </span>
        <el-icon v-if="m.model === modelValue" class="m-check"><Check /></el-icon>
        <span v-if="!m.available" class="m-off">待开通</span>
      </button>
      <div v-if="!list.length" class="menu-empty">暂无可用模型</div>
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
  color: var(--muted);
}

.t-name {
  max-width: 130px;
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

.model-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-tip {
  font-size: 12px;
  color: var(--muted);
  padding: 2px 4px 8px;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
  text-align: left;
}

.model-item:hover {
  background: var(--surface-2);
}

.model-item.active {
  background: var(--surface-2);
}

.model-item.pending {
  opacity: 0.55;
}

.m-icon {
  font-size: 18px;
  color: var(--muted);
  flex-shrink: 0;
}

.m-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.m-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.m-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.m-badge {
  font-size: 10px;
  color: #fff;
  background: #f97316;
  border-radius: 5px;
  padding: 1px 6px;
}

.m-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
}

.m-fit {
  font-size: 11px;
  color: var(--brand);
}

.m-check {
  font-size: 15px;
  color: var(--brand);
  flex-shrink: 0;
}

.m-off {
  font-size: 10px;
  color: var(--muted);
  background: var(--surface-3);
  border-radius: 5px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.menu-empty {
  font-size: 12px;
  color: var(--muted);
  padding: 12px 4px;
  text-align: center;
}
</style>
