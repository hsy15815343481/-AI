import { defineStore } from 'pinia'
import { fetchWallet } from '../api/user'
import { INITIAL_CREDITS } from '../lib/constants'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    credits: INITIAL_CREDITS,
    transactions: []
  }),
  actions: {
    async loadWallet() {
      const data = await fetchWallet()
      this.credits = data?.credits ?? this.credits
      this.transactions = data?.transactions ?? []
      return data
    },
    applyLocalDeduction(cost) {
      // 仅前端兜底展示；真实扣减以后端为准
      this.credits = Math.max(0, this.credits - cost)
    }
  }
})
