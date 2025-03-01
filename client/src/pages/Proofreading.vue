<template>
  <Proofreading />
</template>

<script lang="ts" setup>
import { watch, onBeforeMount, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Proofreading from '../components/proof-reading/Proofreading.vue'
import { useProofreadingStore } from '../store/proofreading'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()
const prrofreadingStore = useProofreadingStore()

const route = useRoute()

watch(
  () => [route.params.book, route.params.page, assetsStore.books],
  ([_book, _page, books]) => {
    if (Object.keys(books).length === 0) return
    const book = _book as string
    const page = parseInt(_page as string)
    prrofreadingStore.initialize(book, page)
  },
  { immediate: true },
)

onBeforeMount(async () => {
  if (Object.keys(assetsStore.books).length === 0) {
    await assetsStore.getAssets()
  }
})

let timer: number = 0
const INTERVAL = 1000 * 5
let previouslySaved: string = ''
onMounted(() => {
  clearTimeout(timer)
  timer = setInterval(() => {
    const newContent = prrofreadingStore.getContentToSave()
    if (!newContent) return
    const { data } = newContent
    const newData = JSON.stringify(data)
    if (newData !== previouslySaved) {
      prrofreadingStore.saveChanges()
      previouslySaved = newData
    }
  }, INTERVAL)
})
onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<style lang="scss" scoped></style>
