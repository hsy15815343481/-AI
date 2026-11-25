<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getToolDef } from '../lib/constants'
import { getPreset } from '../lib/presets'
import { createGeneration, fetchGeneration } from '../api/generations'
import { useAuthStore } from '../stores/auth'
import { useWalletStore } from '../stores/wallet'
import ResultGallery from '../components/ResultGallery.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const wallet = useWalletStore()

const tool = computed(() => getToolDef(route.params.slug))
const preset = computed(() => getPreset(route.query.preset))
const form = reactive({})
const submitting = ref(false)
const polling = ref(false)
const result = ref(null)

const initForm = () => {
  if (!tool.value) return
  for (const field of tool.value.fields) {
    form[field.key] = field.type === 'select' ? field.options[0] : ''
  }
  // 模板预置参数与提示词
  if (preset.value) {
    if (preset.value.params) Object.assign(form, preset.value.params)
    if (preset.value.prompt) form.prompt = preset.value.prompt
    if (preset.value.topic) form.topic = preset.value.topic
  }
  // 作品复用 / 外部跳转带回的字段参数（覆盖模板默认值）
  for (const field of tool.value.fields) {
    const q = route.query[field.key]
    if (q !== undefined && q !== '') form[field.key] = String(q)
  }
}
initForm()

// 同详情页内切换模板或复用作品时，重新回填
watch(() => route.query, initForm)

const validate = () => {
  for (const field of tool.value.fields) {
    if (field.required && !String(form[field.key] || '').trim()) {
      ElMessage.warning(`请填写：${field.label}`)
      return false
    }
  }
  return true
}

const pollUntilDone = async (id) => {
  polling.value = true
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1200))
    const data = await fetchGeneration(id)
    if (data?.status === 'success' || data?.status === 'failed') {
      result.value = data
      return data
    }
  }
  polling.value = false
  ElMessage.warning('任务仍在处理中，可稍后在我的作品查看')
  return null
}

const onSubmit = async () => {
  if (!tool.value) return
  if (!auth.isLoggedIn) {
    ElMessage.info('请先登录后再使用工具')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!validate()) return

  submitting.value = true
  result.value = null
  try {
    const created = await createGeneration({
      tool_slug: tool.value.slug,
      params: { ...form }
    })
    if (created?.id) {
      const done = await pollUntilDone(created.id)
      if (done?.status === 'success') wallet.applyLocalDeduction(tool.value.costCredits)
    } else {
      result.value = created
    }
  } catch (err) {
    ElMessage.error(err.message || '调用失败，请稍后再试')
  } finally {
    submitting.value = false
    polling.value = false
  }
}
</script>

<template>
  <div v-if="tool" class="detail">
    <h1 class="page-title">{{ tool.name }}</h1>
    <p class="muted">{{ tool.description }} · 单次消耗 {{ tool.costCredits }} 积分</p>

    <el-alert
      v-if="preset"
      :type="preset.badge ? 'warning' : 'info'"
      :closable="false"
      class="preset-tip"
    >
      <template #title>已套用模板「{{ preset.title }}」：{{ preset.description }}</template>
      <div v-if="preset.badge" class="muted">该编辑能力待接入对应模型渠道，当前可先编辑、保存提示词。</div>
    </el-alert>

    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <el-card>
          <el-form label-position="top" @submit.prevent>
            <el-form-item v-for="field in tool.fields" :key="field.key" :label="field.label" :required="field.required">
              <el-input v-if="field.type === 'textarea'" v-model="form[field.key]" type="textarea" :rows="4" :placeholder="field.placeholder" />
              <el-select v-else-if="field.type === 'select'" v-model="form[field.key]" style="width: 100%">
                <el-option v-for="opt in field.options" :key="opt" :label="opt" :value="opt" />
              </el-select>
              <el-input v-else v-model="form[field.key]" :placeholder="field.placeholder" />
            </el-form-item>
            <el-button type="primary" :loading="submitting || polling" @click="onSubmit">
              {{ submitting ? '提交中' : polling ? '生成中' : '生成' }}
            </el-button>
          </el-form>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="14">
        <ResultGallery :result="result" :loading="submitting || polling" />
      </el-col>
    </el-row>
  </div>

  <el-empty v-else description="工具不存在或已下架" />
</template>

<style scoped>
.preset-tip {
  margin: 12px 0 16px;
}
</style>
