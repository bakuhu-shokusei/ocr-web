import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listAssets } from '../api'

interface Page {
  imgPath: string
  pageName: string
  ocrPath?: string
}
type Books = Record<string, Page[]>

export const useAssetsStore = defineStore('assets', () => {
  const books = ref<Books>({})

  const getAssets = async () => {
    const assets = await listAssets()
    if (assets) {
      books.value = assets
    }
  }

  return { books, getAssets }
})
