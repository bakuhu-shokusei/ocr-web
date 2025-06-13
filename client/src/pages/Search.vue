<template>
  <div class="search">
    <Search />
  </div>
</template>

<script lang="ts" setup>
import Search from '../components/Search.vue'
</script>

<style lang="scss" scoped>
.search {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 1px 16px;
  box-sizing: border-box;
  overflow: auto;
}
</style>
