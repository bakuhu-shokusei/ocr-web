<template>
  <div class="list">
    <Breadcrumb />
    <!-- <Upload /> -->
    <BookList />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import Breadcrumb from '../components/Breadcrumb.vue'
// import Upload from '../components/Upload.vue'
import BookList from '../components/BookList.vue'
import { useAssetsStore } from '../store/assets'
import { useRoute } from 'vue-router'

const assetsStore = useAssetsStore()
const route = useRoute()

watch(
  () => route.params.path,
  () => {
    assetsStore.getFolders()
  },
  { immediate: true },
)
</script>

<style scoped>
.list {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1px 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>
