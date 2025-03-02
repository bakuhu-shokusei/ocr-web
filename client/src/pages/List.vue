<template>
  <div>
    <div class="list">
      <Upload />
      <BookList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onUnmounted, watch } from 'vue'
import Upload from '../components/Upload.vue'
import BookList from '../components/BookList.vue'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()

onBeforeMount(() => {
  assetsStore.getAssets()
})

let timer: number
const INTERVAL = 1000 * 30
watch(
  () => assetsStore.hasUnfinished,
  (hasUnfinished) => {
    if (hasUnfinished) {
      clearInterval(timer)
      timer = setInterval(assetsStore.getAssets, INTERVAL)
    } else {
      clearInterval(timer)
    }
  },
  { immediate: true },
)
onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.list {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
