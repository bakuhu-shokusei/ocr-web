import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  searchBookByName,
  searchPageContent,
  type Book,
  type Page,
} from '@/api'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

export const PAGE_SIZE = 10

export const useSearchStore = defineStore('search', () => {
  // Reactive state
  const currentStep = ref(1)
  const bookQuery = ref('')
  const contentQuery = ref('')
  const totalBooks = ref(0)
  const totalPages = ref(0)
  const displayedBooks = ref<Book[]>([])
  const selectedBooks = ref<Book[]>([]) // when there is no selection, search the entire database
  const searchResults = ref<(Page & { book_name: string })[]>([])
  const currentPageOfBooks = ref(1)
  const currentPageOfPages = ref(1)
  const loading = ref(false)
  const contentLoading = ref(false)

  // Methods
  const searchBooks = async (page: number) => {
    if (bookQuery.value.trim().length < 2) {
      message.warning('二文字以上を入力してください')
      return
    }

    loading.value = true
    currentPageOfBooks.value = page

    try {
      const result = await searchBookByName(bookQuery.value, {
        page,
        limit: PAGE_SIZE,
      })
      if (!result) throw 'search failed'

      displayedBooks.value = result.data
      totalBooks.value = result.pagination.total

      if (displayedBooks.value.length === 0) {
        message.info('一致する本は見つかりませんでした')
      }
    } catch (error) {
      message.error('エラーが発生しました')
      console.error('Search error:', error)
    } finally {
      loading.value = false
    }
  }

  const isBookSelected = (book: Book) => {
    return selectedBooks.value.some((b) => b.id === book.id)
  }

  const toggleBookSelection = (book: Book) => {
    if (isBookSelected(book)) {
      selectedBooks.value = selectedBooks.value.filter((b) => b.id !== book.id)
    } else if (selectedBooks.value.length < 10) {
      selectedBooks.value = [...selectedBooks.value, book]
    } else {
      message.warning('You can select at most 10 books')
    }
  }

  const removeBook = (book: Book) => {
    selectedBooks.value = selectedBooks.value.filter((b) => b.id !== book.id)
  }

  const goToContentSearch = () => {
    currentStep.value = 2
    resetPageSearch()
  }
  const resetPageSearch = () => {
    contentQuery.value = ''
    totalPages.value = 0
    searchResults.value = []
    currentPageOfPages.value = 1
  }

  const goBackToBookSearch = () => {
    currentStep.value = 1
  }

  const searchContent = async (page: number) => {
    if (contentQuery.value.trim().length < 2) {
      message.warning('二文字以上を入力してください')
      return
    }

    contentLoading.value = true
    currentPageOfPages.value = page

    try {
      const result = await searchPageContent(
        contentQuery.value,
        selectedBooks.value.map((i) => i.id),
        {
          page,
          limit: PAGE_SIZE,
        },
      )
      if (!result) throw 'search failed'

      searchResults.value = result.data
      totalPages.value = result.pagination.total

      if (searchResults.value.length === 0) {
        message.info('一致する内容は見つかりませんでした')
      }
    } catch (error) {
      message.error('エラーが発生しました')
      console.error('Content search error:', error)
    } finally {
      contentLoading.value = false
    }
  }

  const router = useRouter()
  const goToFirstPageOfBook = (id: number) => {
    router.push({
      name: 'proofreading',
      params: { bookId: id, page: 1 },
    })
  }
  const goToPage = (bookId: number, page: number) => {
    router.push({
      name: 'proofreading',
      params: { bookId, page },
    })
  }

  return {
    currentStep,
    bookQuery,
    contentQuery,
    totalBooks,
    totalPages,
    displayedBooks,
    selectedBooks,
    searchResults,
    loading,
    currentPageOfBooks,
    currentPageOfPages,
    contentLoading,

    searchBooks,
    goBackToBookSearch,
    goToContentSearch,
    removeBook,
    isBookSelected,
    toggleBookSelection,
    goToFirstPageOfBook,
    searchContent,
    goToPage,
  }
})
