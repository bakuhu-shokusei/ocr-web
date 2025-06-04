<template>
  <Proofreading />
</template>

<script lang="ts" setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Proofreading from '../components/proof-reading/Proofreading.vue'
import { useProofreadingStore } from '../store/proofreading'

const prrofreadingStore = useProofreadingStore()

const route = useRoute()

watch(
  () => [route.params.path, route.params.page],
  ([_path, _page]) => {
    const path = _path as string
    const page = parseInt(_page as string)
    prrofreadingStore.initialize(path, page)
  },
  { immediate: true },
)

let timer: number = 0
const INTERVAL = 1000 * 5
let previouslySaved: string = ''
onMounted(() => {
  clearTimeout(timer)
  timer = setInterval(() => {
    const newContent = prrofreadingStore.getContentToSave()
    const newData = JSON.stringify(newContent)
    if (newData !== previouslySaved) {
      prrofreadingStore.saveChanges(false)
      previouslySaved = newData
    }
  }, INTERVAL)
})
onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<style lang="scss" scoped></style>
