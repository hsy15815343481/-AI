import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import { getToken } from '../api/http'

const USER_KEY = 'ai_tools_user'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 刷新后从本地恢复用户信息，避免被路由守卫误判为未登录
    user: readStoredUser(),
    token: getToken()
  }),
  getters: {
    isLoggedIn: (s) => Boolean(s.token && s.user)
  },
  actions: {
    persistUser(user) {
      this.user = user || null
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    },
    async register(payload) {
      const data = await authApi.register(payload)
      this.persistUser(data?.user || { nickname: payload.nickname })
      this.token = data?.token || getToken()
      return data
    },
    async login(payload) {
      const data = await authApi.login(payload)
      this.persistUser(data?.user || null)
      this.token = data?.token || getToken()
      return data
    },
    logout() {
      authApi.logout()
      this.persistUser(null)
      this.token = ''
    }
  }
})
