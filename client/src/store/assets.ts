import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { listAssets, deleteBook as apiDeleteBook } from '../api'

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

  const hasUnfinished = computed(() => {
    return Object.values(books.value).some((pages) => {
      return pages.some((p) => !p.ocrPath)
    })
  })

  const deleteBook = async (book: string) => {
    await apiDeleteBook(book)
    await getAssets()
  }

  return { books, getAssets, hasUnfinished, deleteBook }
})
