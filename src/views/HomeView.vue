<script setup>
import { TOOL_DEFS } from '../lib/constants'
import ToolCard from '../components/ToolCard.vue'
</script>

<template>
  <section class="hero">
    <h1>创作，只需要填几个参数</h1>
    <p class="muted">一站式 AI 工具 MVP：AI 绘画、文案生成，开箱即用，登录后消耗积分调用。</p>
    <el-button type="primary" size="large" @click="$router.push('/tools')">开始创作</el-button>
  </section>

  <h2 class="page-title">热门工具</h2>
  <div class="grid">
    <ToolCard v-for="tool in TOOL_DEFS" :key="tool.slug" :tool="tool" />
  </div>
</template>

<style scoped>
.hero {
  padding: 48px 0 24px;
}
.hero h1 {
  font-size: 30px;
  margin: 0 0 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
</style>
