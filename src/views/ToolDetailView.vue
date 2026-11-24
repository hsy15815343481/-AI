<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getToolDef } from '../lib/constants'
import { createGeneration, fetchGeneration } from '../api/generations'
import { useAuthStore } from '../stores/auth'
import { useWalletStore } from '../stores/wallet'
import ResultGallery from '../components/ResultGallery.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const wallet = useWalletStore()

const tool = computed(() => getToolDef(route.params.slug))
const form = reactive({})
const submitting = ref(false)
const polling = ref(false)
const result = ref(null)

const initForm = () => {
  if (!tool.value) return
  for (const field of tool.value.fields) {
    form[field.key] = field.type === 'select' ? field.options[0] : ''
  }
}
initForm()

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
