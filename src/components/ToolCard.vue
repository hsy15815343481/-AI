<script setup>
defineProps({
  tool: { type: Object, required: true }
})
</script>

<template>
  <el-card class="tool-card" shadow="hover">
    <h3>{{ tool.name }}</h3>
    <p class="muted">{{ tool.description }}</p>
    <div class="meta">
      <el-tag size="small">{{ tool.category }}</el-tag>
      <el-tag size="small" type="warning">消耗 {{ tool.costCredits }} 积分</el-tag>
    </div>
    <el-button type="primary" plain class="go" @click="$router.push(`/tool/${tool.slug}`)">开始创作</el-button>
  </el-card>
</template>

<style scoped>
.tool-card {
  height: 100%;
}
.tool-card h3 {
  margin: 0 0 8px;
}
.meta {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.go {
  width: 100%;
}
</style>
