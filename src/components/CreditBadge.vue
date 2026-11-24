<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWalletStore } from '../stores/wallet'

const auth = useAuthStore()
const wallet = useWalletStore()

onMounted(async () => {
  if (auth.isLoggedIn) {
    try {
      await wallet.loadWallet()
    } catch {
      // 后端未接入时保留本地兜底积分
    }
  }
})
</script>

<template>
  <el-tag v-if="auth.isLoggedIn" type="info" effect="plain">积分 {{ wallet.credits }}</el-tag>
</template>
