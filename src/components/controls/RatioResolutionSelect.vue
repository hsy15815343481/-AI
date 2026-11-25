<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, Star } from '@element-plus/icons-vue'
import { RATIO_OPTIONS, RATIO_KIND_MAP, RESOLUTION_OPTIONS } from '../../lib/constants'

const props = defineProps({
  ratio: { type: String, default: 'random' },
  resolution: { type: String, default: '' },
  kind: { type: String, default: 'image' }
})

const emit = defineEmits(['update:ratio', 'update:resolution', 'change'])

const open = ref(false)

const ratios = computed(() => {
  const allow = RATIO_KIND_MAP[props.kind] || []
  return RATIO_OPTIONS.filter((r) => allow.includes(r.value))
})

const resolutions = computed(() => RESOLUTION_OPTIONS[props.kind] || [])

const ratioLabel = computed(() => {
  const r = RATIO_OPTIONS.find((x) => x.value === props.ratio)
  return r ? r.label : '随机比例'
})

const resLabel = computed(() => {
  const r = resolutions.value.find((x) => x.value === props.resolution)
  return r ? r.label : ''
})

function pickRatio(value) {
  emit('update:ratio', value)
  emit('change', { ratio: value, resolution: props.resolution })
}

function pickResolution(value) {
  emit('update:resolution', value)
  emit('change', { ratio: props.ratio, resolution: value })
}
</script>

<template>
  <el-popover v-model:visible="open" placement="bottom-start" :width="280" trigger="click" popper-class="ratio-select-pop">
    <template #reference>
      <button class="trigger" type="button">
        <span class="t-ratio">{{ ratioLabel }}</span>
        <span v-if="resLabel" class="t-sep">｜</span>
        <span v-if="resLabel" class="t-res">{{ resLabel }}</span>
        <el-icon class="t-arrow" :class="{ open }"><ArrowDown /></el-icon>
      </button>
    </template>

    <div class="ratio-menu">
      <div class="menu-label">选择比例</div>
      <div class="ratio-grid">
        <button
          v-for="r in ratios"
          :key="r.value"
          class="ratio-cell"
          :class="{ active: r.value === ratio }"
          type="button"
          @click="pickRatio(r.value)"
        >
          <span v-if="r.shape === 'random'" class="shape star"><Star /></span>
          <span v-else class="shape" :class="r.shape" />
          <span class="ratio-name">{{ r.label }}</span>
        </button>
      </div>

      <div v-if="resolutions.length" class="menu-label res-label">选择分辨率</div>
      <div v-if="resolutions.length" class="res-row">
        <button
          v-for="r in resolutions"
          :key="r.value"
          class="res-cell"
          :class="{ active: r.value === resolution }"
          type="button"
          @click="pickResolution(r.value)"
        >
          {{ r.label }}
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

.t-sep {
  color: var(--muted);
}

.t-res {
  color: var(--muted);
}

.t-arrow {
  font-size: 12px;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.t-arrow.open {
  transform: rotate(180deg);
}

.ratio-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-label {
  font-size: 12px;
  color: var(--muted);
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.ratio-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 8px 4px;
  cursor: pointer;
}

.ratio-cell:hover {
  background: var(--surface-2);
}

.ratio-cell.active {
  border-color: var(--brand);
  background: var(--surface-2);
}

.shape {
  display: inline-block;
  border: 1.5px solid var(--muted);
  border-radius: 2px;
}

.shape.square { width: 13px; height: 13px; }
.shape.portrait { width: 10px; height: 13px; }
.shape.landscape { width: 14px; height: 9px; }
.shape.four-three { width: 13px; height: 10px; }
.shape.nine-sixteen { width: 8px; height: 14px; }
.shape.two-three { width: 10px; height: 13px; }
.shape.three-two { width: 14px; height: 10px; }
.shape.ultrawide { width: 15px; height: 7px; }

.shape.star {
  border: none;
  color: var(--muted);
  font-size: 13px;
  display: flex;
}

.ratio-name {
  font-size: 11px;
  color: var(--text);
}

.res-label {
  margin-top: 2px;
}

.res-row {
  display: flex;
  gap: 8px;
}

.res-cell {
  flex: 1;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}

.res-cell.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
</style>
