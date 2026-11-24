<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const mode = ref('login')
const form = reactive({ email: '', nickname: '', password: '' })
const loading = ref(false)

const submit = async () => {
  if (!form.email || !form.password) {
    ElMessage.warning('请填写邮箱和密码')
    return
  }
  if (mode.value === 'register' && !form.nickname) {
    ElMessage.warning('请填写昵称')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login({ email: form.email, password: form.password })
    } else {
      await auth.register({ email: form.email, nickname: form.nickname, password: form.password })
    }
    ElMessage.success('操作成功')
    router.push(route.query.redirect || '/')
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <el-tabs v-model="mode">
        <el-tab-pane label="登录" name="login" />
        <el-tab-pane label="注册" name="register" />
      </el-tabs>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="you@example.com" />
        </el-form-item>
        <el-form-item v-if="mode === 'register'" label="昵称">
          <el-input v-model="form.nickname" placeholder="你的昵称" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="密码" />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="submit" @click="submit">
          {{ mode === 'login' ? '登录' : '注册并登录' }}
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-wrap {
  max-width: 400px;
  margin: 48px auto;
}
.submit {
  width: 100%;
}
</style>
