<script setup>
defineProps({
  result: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})
</script>

<template>
  <div class="result">
    <el-skeleton v-if="loading" :rows="3" animated />
    <template v-else-if="result">
      <el-image v-if="result.resultUrl" :src="result.resultUrl" fit="contain" class="img" />
      <el-card v-else class="text-box">
        <pre>{{ result.resultText }}</pre>
      </el-card>
    </template>
    <p v-else class="muted">提交后结果将展示在这里。</p>
  </div>
</template>

<style scoped>
.img {
  width: 100%;
  max-height: 360px;
  border-radius: 8px;
}
.text-box pre {
  white-space: pre-wrap;
  margin: 0;
  font-family: inherit;
}
</style>
