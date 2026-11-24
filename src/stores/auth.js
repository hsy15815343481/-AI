import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import { getToken } from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: getToken()
  }),
  getters: {
    isLoggedIn: (s) => Boolean(s.token && s.user)
  },
  actions: {
    async register(payload) {
      const data = await authApi.register(payload)
      this.user = data?.user || { nickname: payload.nickname }
      this.token = data?.token || getToken()
      return data
    },
    async login(payload) {
      const data = await authApi.login(payload)
      this.user = data?.user || null
      this.token = data?.token || getToken()
      return data
    },
    logout() {
      authApi.logout()
      this.user = null
      this.token = ''
    }
  }
})
