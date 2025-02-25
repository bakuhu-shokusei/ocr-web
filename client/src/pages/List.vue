<template>
  <Header />
  <div class="list">
    <Upload />
    <AssetsTables />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Upload from '../components/Upload.vue'
import AssetsTables from '../components/AssetsTables.vue'
import Header from '../components/Header.vue'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()

onMounted(() => {
  assetsStore.getAssets()
})
</script>

<style scoped>
.list {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
