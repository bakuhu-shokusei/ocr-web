import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { listDirectories, deleteBook as apiDeleteBook } from '../api'
import { useLoadingStore } from './loading'
import { useRoute, useRouter } from 'vue-router'

type SubDirItem = {
  path: string
  info: {
    type: 'directory'
    name: string
  }
}

type SubBookItem = {
  path: string
  info: {
    type: 'book'
    imagePath: string
    name: string
  }
}

export const useAssetsStore = defineStore('assets', () => {
  const route = useRoute()
  const router = useRouter()
  const currentPath = computed(() => {
    if (route.name !== 'browse') return null
    return (route.params.path as string) ?? ''
  })

  const subDirs = ref<SubDirItem[]>([])
  const subBookDirs = ref<SubBookItem[]>([])
  const loadingStore = useLoadingStore()

  const updatePath = async (path: string) => {
    if (path === currentPath.value) return

    // reset
    subDirs.value = []
    subBookDirs.value = []

    await router.push({ name: 'browse', params: { path } })
  }

  const getFolders = async () => {
    if (currentPath.value === null) return

    loadingStore.setLoading(true)

    try {
      const dirs: (SubDirItem | SubBookItem)[] = await listDirectories(
        currentPath.value,
      )
      subDirs.value = dirs.filter(
        (i) => i.info.type === 'directory',
      ) as SubDirItem[]
      subBookDirs.value = dirs.filter(
        (i) => i.info.type === 'book',
      ) as SubBookItem[]
    } catch {}
    loadingStore.setLoading(false)
  }

  const deleteBook = async (path: string) => {
    await apiDeleteBook(path)
    await getFolders()
  }

  return {
    currentPath,
    subDirs,
    subBookDirs,
    updatePath,
    getFolders,
    deleteBook,
  }
})
