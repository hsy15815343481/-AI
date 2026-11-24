<script setup>
import { TOOL_DEFS } from '../lib/constants'
import ToolCard from '../components/ToolCard.vue'
</script>

<template>
  <h1 class="page-title">全部工具</h1>
  <div class="grid">
    <ToolCard v-for="tool in TOOL_DEFS" :key="tool.slug" :tool="tool" />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
