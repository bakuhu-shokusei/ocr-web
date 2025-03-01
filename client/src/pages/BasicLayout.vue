<template>
  <div class="basic-layout">
    <Header />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import Header from '../components/Header.vue'
</script>

<style lang="scss" scoped>
.basic-layout {
  height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
}
</style>
