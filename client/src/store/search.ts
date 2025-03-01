import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAssetsStore } from './assets'
import { searchKeyword } from '../api'

interface SearchResult {
  [s: string]: {
    index: number // index of array
    matchedText: string
    pageName: string
  }[]
}

export const useSearchStore = defineStore('search', () => {
  const assetsStore = useAssetsStore()

  const keyword = ref('')
  const searchIn = ref<Record<string, boolean>>({})

  const init = async () => {
    if (Object.keys(assetsStore.books).length === 0) {
      await assetsStore.getAssets()
    }

    const books = Object.keys(assetsStore.books)
    const newSearchIn: Record<string, boolean> = {}
    books.forEach((book) => {
      newSearchIn[book] = true
    })
    Object.keys(searchIn.value).forEach((book) => {
      if (searchIn.value[book] === false && newSearchIn[book]) {
        newSearchIn[book] = false
      }
    })
    searchIn.value = newSearchIn
  }
  const loading = ref(false)
  const searchResult = ref<SearchResult>({})

  const search = async () => {
    if (!keyword.value) {
      searchResult.value = {}
      return
    }

    loading.value = true
    const books = Object.keys(assetsStore.books).filter(
      (book) => searchIn.value[book],
    )
    const result = await searchKeyword(books, keyword.value)

    loading.value = false
    searchResult.value = result
  }

  return { keyword, searchIn, search, loading, searchResult, init }
})
