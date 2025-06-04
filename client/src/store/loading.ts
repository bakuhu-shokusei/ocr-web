import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoadingStore = defineStore('loading', () => {
  const loading = ref(false)
  const setLoading = (l: boolean) => {
    loading.value = l
  }

  return { loading, setLoading }
})
