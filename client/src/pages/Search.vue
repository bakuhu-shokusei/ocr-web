<template>
  <div class="search">
    <Search />
  </div>
</template>

<script lang="ts" setup>
// import { onBeforeMount } from 'vue'
import Search from '../components/Search.vue'
// import { useSearchStore } from '../store/search'
//
// const searchStore = useSearchStore()
// onBeforeMount(() => {
//   searchStore.init()
// })
</script>

<style lang="scss" scoped>
.search {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1px 16px;
  box-sizing: border-box;
}
</style>
