<script setup>
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { useWalletStore } from '../stores/wallet'

const auth = useAuthStore()
const wallet = useWalletStore()

onMounted(async () => {
  try {
    await wallet.loadWallet()
  } catch (err) {
    ElMessage.error(err.message || '钱包信息加载失败')
  }
})
</script>

<template>
  <h1 class="page-title">个人中心</h1>
  <el-row :gutter="16">
    <el-col :xs="24" :md="8">
      <el-card>
        <p class="muted">昵称</p>
        <h3>{{ auth.user?.nickname || '未设置' }}</h3>
        <p class="muted">当前积分</p>
        <h3>{{ wallet.credits }}</h3>
      </el-card>
    </el-col>
    <el-col :xs="24" :md="16">
      <el-card>
        <template #header>积分流水</template>
        <el-table :data="wallet.transactions" empty-text="暂无流水">
          <el-table-column prop="reason" label="说明" />
          <el-table-column prop="changeAmount" label="变动" width="100" />
          <el-table-column prop="balanceAfter" label="余额" width="100" />
          <el-table-column prop="createdAt" label="时间" width="180" />
        </el-table>
      </el-card>
    </el-col>
  </el-row>
</template>
