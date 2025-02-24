import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listAssets } from '../api'

interface Page {
  imgPath: string
  pageName: string
  ocrResult: JsonOutput | null
}
type Books = Record<string, Page[]>
type BoxOutput = [number, number, number, number, string]
type JsonOutput = {
  contents: BoxOutput[]
  imginfo: {
    img_width: number
    img_height: number
    img_path: string
    img_name: string
  }
}

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
