import { defineStore } from 'pinia'
import { fetchMyWorks } from '../api/generations'

export const useWorksStore = defineStore('works', {
  state: () => ({
    list: [],
    loaded: false
  }),
  actions: {
    async loadWorks() {
      const data = await fetchMyWorks()
      this.list = Array.isArray(data) ? data : data?.works || []
      this.loaded = true
      return this.list
    }
  }
})
